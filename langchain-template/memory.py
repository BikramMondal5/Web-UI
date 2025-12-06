I want you to use this logic to add meomory for all the models. import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.meomory import ConversationBufferWindowMemory
from langchain.chains import conversionChain

meomory = ConversationBufferWindowMemory(k=1)
load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
)

convo = conversionChain(llm=model)
print(convo.run("Who is the prime minister of India?"))  # Narendra modi
print(convo.run("2+2=?")) # 4
print(convo.run("What is his full form?")) # Narendra Damodardas Modi
