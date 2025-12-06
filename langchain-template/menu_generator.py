import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chains import SimpleSequentialChain
from langchain.chains import SequentialChain

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
)

def generate_restaurant_name_and_items(cuisine):
   prompt1 = PromptTemplate(
      input_variables=["cuisine"],
        template="I want to open a restaurant for {cuisine} food. Suggest a fancy name for this. Give only one name"
    )
   
   chain1 = LLMChain(llm=model, prompt=prompt1, output_key="restaurant_name")
        
   prompt2 = PromptTemplate(
        input_variables=["restaurant_name"],
        template="Suggest some menu items for {restaurant_name}. Return it as a comma separated string."
    )
   chain2 = LLMChain(llm = model, prompt=prompt2, output_key="menu_items")
   chain = SequentialChain(
        chains=[chain1, chain2],
        input_variables=["cuisine"],
        output_variables=["restaurant_name", "menu_items"],
        verbose=True
    )

   return chain({"cuisine": cuisine})

