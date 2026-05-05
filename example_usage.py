"""Example usage of StudyBuddy with link support."""
from studybuddy import ClassroomClient, StudyBuddyAI
from google.oauth2.credentials import Credentials

def main():
    # Initialize clients
    creds = Credentials.from_authorized_user_file('token.json')
    classroom = ClassroomClient(creds)
    ai = StudyBuddyAI(api_key='your-openai-key')
    
    # Get course announcements
    courses = classroom.get_courses()
    if courses:
        course_id = courses[0]['id']
        announcements = classroom.get_announcements(course_id)
        
        for announcement in announcements:
            print(f"Announcement: {announcement.get('text', '')[:100]}...")
            
            # Check for links
            links = announcement.get('_extracted_links', [])
            if links:
                print(f"Found {len(links)} links, fetching content...")
                
                # Fetch content from links
                link_contents = classroom.fetch_link_contents(announcement)
                
                # Add to AI context
                ai.add_link_context(link_contents)
                
                # Ask question about the content
                answer = ai.answer_from_links(
                    "What are the main topics covered in these materials?",
                    link_contents
                )
                print(f"AI Answer: {answer}")

if __name__ == "__main__":
    main()
