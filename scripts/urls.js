// Test if candidate string is a web URL
function isWebUrl(urlCandidate)
{
  try
  {
    let url = new URL(urlCandidate);
    if ((url.protocol == 'https:' || url.protocol == 'http:') && url.hostname !== '')
    {
      return true;
    }
    return null;
  }
  catch (error)
  {
    return false;
  }
}


// Test if URL is Instapaper reading list
function isInstapaperListView(url)
{
  return (url && url.startsWith(URL_READING_LIST));
}


// Test if URL is an Instapaper bookmark
function isInstapaperBookmark(url)
{
  return (url && url.startsWith(URL_READ_BOOKMARK));
}


// Test if URL is Instapaper.com’s reading list
function isInstapaperTextView(url)
{
  return (url && url.startsWith(URL_READ_URL));
}


// Test if URL is reading oriented Instapaper page
function isInstapaperReadingUrl(url)
{
  return (url && (isInstapaperListView(url) || isInstapaperBookmark(url) || isInstapaperTextView(url)));
}


// Test if candidate string is an Firefox reading view URL
function isFirefoxReaderViewUrl(urlCandidate)
{
  try {
    let readingModeUrl = new URL(urlCandidate);
    if (readingModeUrl.protocol == 'about:' &&
        readingModeUrl.pathname == 'reader' &&
        readingModeUrl.searchParams.has('url'))
    {
      return true;
    }
  }
  catch (error)
  {
    return false;
  }
}


// Convert Firefox reading view URL to web URL
function firefoxReaderViewToUrl(url)
{
  if (url && isFirefoxReaderViewUrl(url))
  {
    try
    {
      let webUrl = new URL(url).searchParams.get('url').toString();
      if (isWebUrl(webUrl))
      {
        return webUrl;
      }
      return null;
    }
    catch (error)
    {
      return false;
    }
  }
}