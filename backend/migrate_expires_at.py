"""One-time migration: convert string expires_at to datetime for TTL index."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def migrate():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["unsent_valentine"]

    for coll_name in ["orders", "letters"]:
        coll = db[coll_name]
        count = 0
        async for doc in coll.find({"expires_at": {"$type": "string"}}):
            try:
                dt = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
                if dt.tzinfo:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                await coll.update_one({"_id": doc["_id"]}, {"$set": {"expires_at": dt}})
                count += 1
            except Exception as e:
                print(f"  Skipping {doc.get('_id')}: {e}")
        print(f"  {coll_name}: migrated {count} docs")

    # Also migrate opened_at and created_at if stored as strings in letters
    coll = db["letters"]
    count = 0
    async for doc in coll.find({"opened_at": {"$type": "string"}}):
        try:
            dt = datetime.fromisoformat(doc["opened_at"].replace("Z", "+00:00"))
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            await coll.update_one({"_id": doc["_id"]}, {"$set": {"opened_at": dt}})
            count += 1
        except Exception:
            pass
    print(f"  letters.opened_at: migrated {count} docs")

    print("Migration complete")

if __name__ == "__main__":
    asyncio.run(migrate())
