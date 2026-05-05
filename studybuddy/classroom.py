 from googleapiclient.discovery import build
 from google.oauth2.credentials import Credentials
 import logging
from typing import List, Dict
from .content_fetcher import LinkExtractor, ContentFetcher
 
 logger = logging.getLogger(__name__)
 
     def __init__(self, credentials: Credentials):
         self.service = build('classroom', 'v1', credentials=credentials)
         self.courses = self.service.courses()
        self.link_extractor = LinkExtractor()
        self.content_fetcher = ContentFetcher()
     
     def get_courses(self, active_only=True):
         """Retrieve list of courses."""
         """Get announcements for a specific course."""
         try:
             response = self.courses.announcements().list(courseId=course_id).execute()
            return response.get('announcements', [])
            announcements = response.get('announcements', [])
            
            # Process announcements to extract links
            for announcement in announcements:
                announcement['_extracted_links'] = self._extract_links_from_announcement(announcement)
            
            return announcements
         except Exception as e:
             logger.error(f"Error fetching announcements: {e}")
             return []
     
    def _extract_links_from_announcement(self, announcement: Dict) -> List[str]:
        """Extract all links from an announcement."""
        links = []
        
        # Extract from text content
        text = announcement.get('text', '')
        links.extend(self.link_extractor.extract_links(text))
        
        # Extract from attachments
        attachments = announcement.get('materials', [])
        links.extend(self.link_extractor.extract_from_attachments(attachments))
        
        return links
    
     def get_course_work(self, course_id):
         """Get coursework/assignments for a specific course."""
         try:
             response = self.courses.courseWork().list(courseId=course_id).execute()
            return response.get('courseWork', [])
            coursework = response.get('courseWork', [])
            
            # Process coursework to extract links
            for work in coursework:
                work['_extracted_links'] = self._extract_links_from_coursework(work)
            
            return coursework
         except Exception as e:
             logger.error(f"Error fetching coursework: {e}")
             return []
    
    def _extract_links_from_coursework(self, coursework: Dict) -> List[str]:
        """Extract all links from coursework."""
        links = []
        
        # Extract from description
        description = coursework.get('description', '')
        links.extend(self.link_extractor.extract_links(description))
        
        # Extract from materials/attachments
        materials = coursework.get('materials', [])
        links.extend(self.link_extractor.extract_from_attachments(materials))
        
        return links
    
    def fetch_link_contents(self, course_item: Dict) -> List[Dict]:
        """Fetch content from all links in a course item."""
        links = course_item.get('_extracted_links', [])
        if not links:
            return []
        return self.content_fetcher.fetch_multiple(links)

diff --git a/studybuddy/ai_bot.py b/studybuddy/ai_bot.py
