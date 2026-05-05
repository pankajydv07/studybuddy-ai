 import os
 from typing import List, Dict, Optional
 import logging
from .content_fetcher import format_for_ai
 
 logger = logging.getLogger(__name__)
 
             openai.api_key = api_key
         self.model = model
         self.conversation_history = []
        self.link_context = []
     
    def ask(self, question: str, course_context: Optional[str] = None) -> str:
    def add_link_context(self, link_contents: List[Dict]):
        """Add content from fetched links to the context."""
        self.link_context.extend(link_contents)
    
    def clear_link_context(self):
        """Clear the link context."""
        self.link_context = []
    
    def ask(self, question: str, course_context: Optional[str] = None, 
            link_contents: Optional[List[Dict]] = None) -> str:
         """Ask the AI a question with optional course context."""
         messages = []
         
         # System message with context
        if course_context:
            system_msg = f"You are a helpful study assistant. Use the following course context to answer questions: {course_context}"
        else:
            system_msg = "You are a helpful study assistant."
        context_parts = []
        if course_context:
            context_parts.append(f"Course Context: {course_context}")
        
        # Add link contents to context
        links_to_use = link_contents if link_contents is not None else self.link_context
        if links_to_use:
            link_context = format_for_ai(links_to_use)
            context_parts.append(f"Reference Materials from Links:\n{link_context}")
        
        if context_parts:
            system_msg = f"You are a helpful study assistant. Use the following context to answer questions:\n\n" + "\n\n".join(context_parts)
            system_msg += "\n\nWhen referencing information from links, cite the source URL."
        else:
            system_msg = "You are a helpful study assistant."
         
         messages.append({"role": "system", "content": system_msg})
         
        # Add conversation history
        messages.extend(self.conversation_history[-5:])  # Keep last 5 exchanges
        
         # Add user question
         messages.append({"role": "user", "content": question})
         
             )
             
             answer = response.choices[0].message.content
            
            # Store in conversation history
            self.conversation_history.extend([
                {"role": "user", "content": question},
                {"role": "assistant", "content": answer}
            ])
            
             return answer
         except Exception as e:
             logger.error(f"Error calling OpenAI API: {e}")
     
     def summarize_material(self, text: str) -> str:
         """Summarize study material."""
        return self.ask(f"Please summarize the following material:\n\n{text}")
    
    def answer_from_links(self, question: str, link_contents: List[Dict]) -> str:
        """Answer a question based on provided link contents."""
        if not link_contents:
            return "No link content provided to analyze."
        
        # Format link contents
        formatted = format_for_ai(link_contents)
        
        prompt = f"""Based on the following reference materials from attached links, please answer this question: {question}

Reference Materials:
{formatted}

Please provide a comprehensive answer citing specific sources where applicable."""
        
         return self.ask(prompt)
 
diff --git a/requirements.txt b/requirements.txt
