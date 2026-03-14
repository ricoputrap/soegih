from fastapi import APIRouter

router = APIRouter()


@router.post("/parse")
def parse_transaction(text: str):
    return {"type": "expense", "amount": 0, "text": text}
