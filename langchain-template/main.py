import streamlit as st
import menu_generator as mg
st.title("Restaurant Name and Menu Suggestion Generator")
cuisine = st.sidebar.selectbox("Pick a cuisine!", ("Indian", "Italian", "Chinese", "Mexican", "French"))

if cuisine:
    response = mg.generate_restaurant_name_and_items(cuisine)
    st.header(response["restaurant_name"].strip())
    menu_items = response["menu_items"].strip().split(", ")
    st.write("***Menu Items:***")

    for item in menu_items:
        st.write(f"- {item}")

        