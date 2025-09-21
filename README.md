# MediVoice

MediVoice is a healthcare voice assistant project designed to provide quick, AI-driven responses to user health-related queries.  

## 🚀 Features
- Voice-based interaction with AI  
- Stores and processes health-related data  
- Includes `health_data.json` for reference cases  
- Simple and beginner-friendly structure  

## 📂 Project Structure
MediVoice
│ README.md
│ health_data.json
│ requirements.txt
│ app.py
│
├───static
│ style.css
│
└───templates
index.html

## 📊 Health Data
The `health_data.json` file contains a wide range of medical cases (symptoms, conditions, remedies).  
This allows the assistant to provide quick responses based on predefined knowledge.  

## 🛠️ Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/mubarak6969/MediVoice.git
   cd MediVoice
2. Create a virtual environment:
python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows
3. Install dependencies:
pip install -r requirements.txt

4. Run the application:
python app.py

##📝 Project Description

MediVoice is an AI-powered healthcare voice assistant that helps users quickly identify possible health conditions based on their symptoms. The system uses a predefined dataset (health_data.json) containing a wide range of medical cases (symptoms, conditions, and remedies). Users can interact with the system through voice or text, and the application responds with relevant health information.

This project demonstrates how AI-driven natural language processing can be applied to healthcare for quick, accessible, and educational purposes. While it is not a replacement for professional medical advice, MediVoice serves as a helpful health information assistant for common symptoms and conditions.

🔑 Key Highlights

Voice-based and text-based symptom checking

Knowledge base powered by health_data.json

Beginner-friendly Python + Flask backend

Clean frontend with HTML/CSS

Easily extendable with real-world APIs in the future
