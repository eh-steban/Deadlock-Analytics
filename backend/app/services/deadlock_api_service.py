from typing import Any
from app.infra.deadlock_api.deadlock_api_client import DeadlockAPIClient

api_client = DeadlockAPIClient()

class DeadlockAPIService:
    async def get_account_match_history(self, account_id: str) -> list[dict[str, Any]]:
        return await api_client.fetch_account_match_history(account_id)

    async def get_match_metadata(self, match_id: str) -> dict[str, Any]:
        return await api_client.fetch_match_metadata(match_id)

    async def get_demo_url(self, match_id: int) -> dict[str, str]:
        salts_response = await self.get_salts(match_id)
        return {"demo_url": salts_response["demo_url"]}
    
    # DLAPIService#fetch_salts returns a response that looks like:
    # {
    #     match_id (int): Unique identifier for the match.
    #     cluster_id (int): Identifier for the server cluster where the match was hosted.
    #     metadata_salt (int): Salt used to generate the metadata URL.
    #     replay_salt (int): Salt used to generate the replay/demo URL.
    #     metadata_url (str): URL pointing to the compressed match metadata (.meta.bz2).
    #     demo_url (str): URL pointing to the compressed replay/demo file (.dem.bz2).
    # }
    async def get_salts(self, match_id: int) -> dict[str, str]:
        return await api_client.fetch_salts(match_id)

    async def get_and_download_replay(self, demo_url: str, match_id: int) -> str:
        print(f"Starting download from {demo_url}")
        replay_file_stream = await api_client.get_new_stream(demo_url)
        output_file_path = await api_client.download_from_stream(replay_file_stream, match_id)
        print(f"Download complete: {output_file_path}")
        return output_file_path
