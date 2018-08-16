const USER_AGENT = navigator.userAgent + ' ReadWithInstapaper/' + browser.runtime.getManifest().version 
const URL_INSTAPAPER = 'https://www.instapaper.com/';
const API_ENDPOINT = URL_INSTAPAPER + 'api/';
const URL_READ_URL = URL_INSTAPAPER + 'text?u=';
const URL_READ_BOOKMARK = URL_INSTAPAPER + 'read/';
const URL_READING_LIST = URL_INSTAPAPER + 'u';