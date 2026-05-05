import hashlib
import json
from web3 import Web3
from app.core.config import settings

class BlockchainAuditor:
    def __init__(self):
        """
        Initializes connection to Ganache and sets up the administrative 
        account for anchoring audit results.
        """
        # Connection to Ganache (Default is http://127.0.0.1:7545)
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_URL))
        
        # Verify connection
        if not self.w3.is_connected():
            print("CRITICAL: Blockchain node (Ganache) not found.")
        
        # In a hackathon, we use the first Ganache account for convenience
        self.admin_account = self.w3.eth.accounts[0]

    def _generate_data_hash(self, data: dict) -> str:
        """
        Generates a SHA-256 hash of the evaluation result.
        This hash represents the 'Digital Fingerprint' of the AI's verdict.
        """
        encoded_data = json.dumps(data, sort_keys=True).encode()
        return hashlib.sha256(encoded_data).hexdigest()

    def record_on_chain(self, bidder_id: str, data_to_hash: dict, event_type: str) -> str:
        """
        Records the AI evaluation hash onto the Ganache ledger.
        This provides the 'Blockchain: Connected' status seen in your UI.
        """
        try:
            # 1. Create the unique hash of the evaluation
            data_hash = self._generate_data_hash(data_to_hash)
            
            # 2. Prepare Metadata to be stored in the Transaction 'Input Data'
            # This allows us to search the ledger for specific bidder audits later
            payload = {
                "bidder": bidder_id,
                "event": event_type,
                "ai_verdict_hash": data_hash
            }
            
            # 3. Create the Transaction
            tx_params = {
                'from': self.admin_account,
                'to': self.w3.eth.accounts[1], # Sending to a dummy secondary account
                'value': self.w3.to_wei(0, 'ether'), # Zero value tx (only for data storage)
                'data': self.w3.to_hex(text=json.dumps(payload)),
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price
            }
            
            # 4. Sign and Send (Ganache handles signing automatically for unlocked accounts)
            tx_hash = self.w3.eth.send_transaction(tx_params)
            
            # 5. Wait for the block to be mined to ensure immutability
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            print(f"Audit Anchored: {bidder_id} | Hash: {tx_hash.hex()}")
            return tx_hash.hex()
            
        except Exception as e:
            print(f"Blockchain anchoring failed: {str(e)}")
            return "ERROR_ANCHORING_FAILED"

    def verify_integrity(self, tx_hash: str, original_data: dict) -> bool:
        """
        Utility for the 'Auditor Suite' to verify that the current data 
        matches the original blockchain record.
        """
        tx = self.w3.eth.get_transaction(tx_hash)
        input_data = self.w3.to_text(tx['input'])
        stored_payload = json.loads(input_data)
        
        current_hash = self._generate_data_hash(original_data)
        return current_hash == stored_payload['ai_verdict_hash']