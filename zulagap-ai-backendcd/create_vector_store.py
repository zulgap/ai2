import sys
import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

file_path = sys.argv[1]
doc_id = sys.argv[2]

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
VECTOR_STORE_ID = os.environ.get("OPENAI_VECTOR_STORE_ID")

client = OpenAI(api_key=OPENAI_API_KEY)

# 파일 업로드 (파일명에 문서ID 포함)
file = client.files.create(
    file=open(file_path, "rb"),
    purpose="user_data",
    file_name=f"{doc_id}_{file_path.split('/')[-1]}"
)
file_id = file.id

# 벡터스토어에 파일 추가
client.vector_stores.files.create(
    vector_store_id=VECTOR_STORE_ID,
    file_id=file_id
)
print("파일이 벡터스토어에 추가되었습니다.")