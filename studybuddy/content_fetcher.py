import re
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class LinkExtractor:
    """Extracts links from classroom materials and announcements."""
    
    @staticmethod
    def extract_links(text: str) -> List[str]:
        """Extract URLs from text content."""
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)
        return list(set(urls))  # Remove duplicates
    
    @staticmethod
    def extract_from_attachments(attachments: List[Dict]) -> List[str]:
        """Extract links from classroom attachment objects."""
        links = []
        for attachment in attachments:
            if attachment.get('link', {}).get('url'):
                links.append(attachment['link']['url'])
            if attachment.get('driveFile', {}).get('alternateLink'):
                links.append(attachment['driveFile']['alternateLink'])
        return links

class ContentFetcher:
    """Fetches and processes content from URLs for AI context."""
    
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_content(self, url: str) -> Optional[Dict]:
        """Fetch and extract text content from a URL."""
        try:
            if 'drive.google.com' in url or 'docs.google.com' in url:
                return self._fetch_google_drive_content(url)
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            text = soup.get_text(separator='\n', strip=True)
            title = soup.title.string if soup.title else url
            
            return {
                'url': url,
                'title': title,
                'content': text[:5000],  # Limit content length
                'domain': urlparse(url).netloc
            }
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def _fetch_google_drive_content(self, url: str) -> Dict:
        """Handle Google Drive links specially."""
        # For Google Drive, we return metadata since we can't easily scrape the content
        return {
            'url': url,
            'title': 'Google Drive File',
            'content': f'This is a Google Drive link: {url}. The file content would need to be accessed via Google Drive API.',
            'domain': 'drive.google.com'
        }
    
    def fetch_multiple(self, urls: List[str]) -> List[Dict]:
        """Fetch content from multiple URLs."""
        results = []
        for url in urls:
            content = self.fetch_content(url)
            if content:
                results.append(content)
        return results

def format_for_ai(sources: List[Dict]) -> str:
    """Format fetched content for AI context."""
    context_parts = []
    for i, source in enumerate(sources, 1):
        context_parts.append(f"Source {i}: {source['title']} ({source['url']})\n{source['content']}\n")
    return "\n---\n".join(context_parts)

diff --git a/studybuddy/classroom.py b/studybuddy/classroom.py
