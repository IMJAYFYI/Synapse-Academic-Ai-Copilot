import os
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")

# --- MACRO EXTRACTION LOGIC (Upload Phase) ---

class Topic(BaseModel):
    title: str = Field(description="The specific name of the course module or subject.")
    hours_required: int = Field(description="Estimated number of hours required to study this topic.")

class SyllabusAnalysis(BaseModel):
    course_name: str = Field(description="The official name of the course or degree program.")
    topics: List[Topic] = Field(description="A sequential list of all subjects extracted from the syllabus.")

def analyze_syllabus(raw_text: str) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0,
        google_api_key=GEMINI_API_KEY
    )

    structured_llm = llm.with_structured_output(SyllabusAnalysis)

    prompt = PromptTemplate.from_template(
        "You are an expert academic data extraction system.\n"
        "Analyze the following raw syllabus text.\n"
        "1. Identify the overall Course Name (e.g., Bachelor of Computer Applications).\n"
        "2. DATA ANCHOR: Scan the text for course codes like 'BCA-101', 'BCA-102', 'BCA-201', etc. The text immediately following these codes are the subjects.\n"
        "3. Extract EVERY subject title (e.g., 'Computer Fundamentals', 'Operating Systems') into the topics list.\n"
        "4. For hours, look for 'Hours / Week' (multiply that number by 15 for total semester hours) or use 60 as a fallback default.\n"
        "5. CRITICAL: You MUST return a populated 'topics' array. Do not return an empty list.\n\n"
        "Raw Syllabus Text:\n{text}"
    )

    chain = prompt | structured_llm
    result = chain.invoke({"text": raw_text})
    
    return result.model_dump_json()

# --- MICRO EXTRACTION LOGIC (Just-In-Time Phase) ---

class UnitDetail(BaseModel):
    unit_name: str = Field(description="The structured name of the unit. You MUST prepend it with 'Unit X:' where X is the unit number (e.g., 'Unit 1: Algorithm and algorithm development')")
    key_concepts: List[str] = Field(description="A list of 3 to 5 specific concepts covered in this unit")

class SubjectDetails(BaseModel):
    subject_name: str = Field(description="The name of the subject.")
    units: List[UnitDetail] = Field(description="The detailed unit-by-unit breakdown of the subject.")

def extract_subject_details(raw_text: str, subject_name: str) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.1,
        google_api_key=GEMINI_API_KEY
    )

    structured_llm = llm.with_structured_output(SubjectDetails)

    prompt = PromptTemplate.from_template(
        "You are an expert academic data extraction system.\n"
        "Analyze the following raw syllabus text.\n"
        "Locate the specific subject named: '{subject}'.\n"
        "Extract the detailed unit-by-unit breakdown (Units and key concepts) strictly for this subject ONLY.\n"
        "CRITICAL: Ensure every unit_name strictly follows the format 'Unit X: [Name]', where X is the sequential unit number.\n\n"
        "Raw Syllabus Text:\n{text}"
    )

    chain = prompt | structured_llm
    result = chain.invoke({"text": raw_text, "subject": subject_name})
    
    return result.model_dump_json()
# --- AGENTIC STUDY COACH LOGIC ---

def chat_with_coach(user_message: str, chat_history: list, active_topic: str) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", # Using your confirmed active model
        temperature=0.5, # Slightly higher temperature for conversational flexibility
        google_api_key=GEMINI_API_KEY
    )

    # 1. Initialize the context window with a strict System Prompt
    messages = [
        SystemMessage(
            content=f"You are an expert AI Study Coach. The student is currently studying: [{active_topic}]. "
                    f"Keep answers highly technical, concise, and strictly related to the subject matter. "
                    f"Provide code examples or mathematical formulas where necessary. Do not use analogies. "
                    f"CRITICAL: If you generate a Markdown table and need to include the pipe character '|' inside a cell (like Bitwise OR or Logical OR), you MUST use the HTML entity '&#124;' instead of the raw character, otherwise it will break the table formatting."
        )
    ]

    # 2. Reconstruct the conversation history from the frontend data
    for msg in chat_history:
        if msg["sender"] == "user":
            messages.append(HumanMessage(content=msg["text"]))
        elif msg["sender"] == "ai":
            # Ignore backend system alerts (like "Session Logged") in the LLM context
            if "✅" not in msg["text"] and "❌" not in msg["text"]:
                messages.append(AIMessage(content=msg["text"]))

    # 3. Append the newest query
    messages.append(HumanMessage(content=user_message))

    # 4. Execute the chain
    response = llm.invoke(messages)
    return response.content

from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

def ingest_syllabus_to_vectorstore(text: str, syllabus_id: int):
    """Chunks the raw syllabus text and stores it in ChromaDB for RAG."""
    if not text.strip():
        return
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=os.getenv("GEMINI_API_KEY"))
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_text(text)
    
    if not splits:
        return
        
    vectorstore = Chroma(persist_directory="./.chroma_db", embedding_function=embeddings)
    metadatas = [{"syllabus_id": syllabus_id}] * len(splits)
    vectorstore.add_texts(texts=splits, metadatas=metadatas)

def chat_with_coach_stream(user_message: str, chat_history: list, active_topic: str, syllabus_context: str = None):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.3, 
        google_api_key=GEMINI_API_KEY
    )
    
    # RAG Retrieval
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=GEMINI_API_KEY)
    
    vectorstore = Chroma(persist_directory="./.chroma_db", embedding_function=embeddings)
    
    # Try to retrieve context based on the topic and message
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    try:
        docs = retriever.invoke(f"{active_topic} {user_message}")
        rag_context = "\n\n".join([d.page_content for d in docs])
    except:
        rag_context = "No additional textbook context found."
    
    syllabus_instruction = ""
    if syllabus_context:
        syllabus_instruction = f"\n\nHere is the exact syllabus breakdown for {active_topic}:\n{syllabus_context}\nYou MUST use this as the absolute source of truth for all unit numbers and topics. If the student asks to start 'Unit X', look at this exact breakdown to see what Unit X is.\n"

    messages = [
        SystemMessage(
            content=f"You are an expert AI Study Coach. The student is currently studying: [{active_topic}].\n\n"
                    f"{syllabus_instruction}"
                    f"Use the following retrieved context from their syllabus/textbook to answer accurately. "
                    f"If the context doesn't contain the answer, you can use your own knowledge, but prioritize the provided text.\n\n"
                    f"--- RETRIEVED CONTEXT ---\n{rag_context}\n------------------------\n\n"
                    f"Keep answers highly technical, concise, and strictly related to the subject matter. "
                    f"Provide code examples or mathematical formulas where necessary. Do not use analogies. "
                    f"CRITICAL: If you generate a Markdown table and need to include the pipe character '|' inside a cell, you MUST use the HTML entity '&#124;' instead."
        )
    ]
    
    for msg in chat_history[-10:]:
        if msg["sender"] == "user":
            messages.append(HumanMessage(content=msg["text"]))
        elif msg["sender"] == "ai":
            if "✅" not in msg["text"] and "❌" not in msg["text"]:
                messages.append(AIMessage(content=msg["text"]))

    messages.append(HumanMessage(content=user_message))

    for chunk in llm.stream(messages):
        if chunk.content:
            yield chunk.content


# --- PYDANTIC MODELS FOR NOTES ---
class Definition(BaseModel):
    term: str
    definition: str

class StudyNoteOutput(BaseModel):
    title: str
    summary: str
    key_points: List[str]
    definitions: List[Definition]
    examples: List[str]

def generate_study_notes(topic: str, chat_history: list) -> str:
    """Reads recent chat conversation and extracts structured educational notes."""
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
    structured_llm = llm.with_structured_output(StudyNoteOutput)
    
    # Format chat history into readable text
    conversation_text = "\n".join([f"{msg['sender'].upper()}: {msg['text']}" for msg in chat_history if msg.get('text')])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert academic note-taker. Analyze this tutoring conversation about '{topic}' and extract comprehensive, well-structured study notes.
        
Rules:
- title: A clear, descriptive title for these notes
- summary: A 2-3 sentence overview of what was covered
- key_points: 5-8 important takeaways as bullet points
- definitions: Important terms and their definitions (at least 3)
- examples: Practical examples or analogies discussed (at least 2)

Extract ONLY information that was actually discussed in the conversation. Do not invent content."""),
        ("human", "Here is the tutoring conversation:\n\n{conversation}")
    ])
    
    chain = prompt | structured_llm
    result = chain.invoke({"topic": topic, "conversation": conversation_text})
    return result.model_dump_json()

# --- PYDANTIC MODELS FOR QUIZ ---
class QuizOption(BaseModel):
    label: str  # "A", "B", "C", "D"
    text: str

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    correct_answer: str  # "A", "B", "C", or "D"
    explanation: str

class QuizPayload(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]

def generate_quiz(topic: str, context: str, difficulty: str = "medium", num_questions: int = 5) -> str:
    """Generates a structured MCQ quiz from syllabus/notes content."""
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    structured_llm = llm.with_structured_output(QuizPayload)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert academic quiz generator. Create a {difficulty} difficulty quiz with exactly {num_questions} multiple-choice questions about '{topic}'.

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- Only ONE correct answer per question
- The correct_answer field must be exactly "A", "B", "C", or "D"
- Provide a brief explanation for why the correct answer is right
- Questions should test understanding, not just memorization
- Vary question difficulty within the specified level
- Base questions on the provided context/syllabus material"""),
        ("human", "Generate the quiz based on this context:\n\n{context}")
    ])
    
    chain = prompt | structured_llm
    result = chain.invoke({
        "topic": topic,
        "difficulty": difficulty,
        "num_questions": str(num_questions),
        "context": context
    })
    return result.model_dump_json()
