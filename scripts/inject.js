/*
  Copyright © 2018 Daniel Aleksandersen <https://www.daniel.priv.no/>

  This file is part of Read with Instapaper.

  Read with Instapaper is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License version
  3 as published by the Free Software Foundation.

  Read with Instapaper is distributed in the hope that it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty
  of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Read with Instapaper.
  If not, see <https://www.gnu.org/licenses/>.
*/


var __prefixes = null,
    __instapaper_og_prefix = null,
    __instapaper_dc_prefix = null,
    __instapaper_descr = null,
    __instapaper_url = null;


// Get Open Graph and Dublin Core prefixes from namespaces on the document root
if (__instapaper_prefixes = document.body.parentElement.attributes['prefix'])
{
  [/([0-9a-zA-Z]+): ?https?:\/\/ogp.me\/ns\/?#/, /([0-9a-zA-Z]+): ?https?:\/\/purl.org\/dc\/terms\/?#/].forEach(
    (__instapaper_pattern) =>
    {
      var __instapaper_matches = __instapaper_prefixes.value.match(__instapaper_pattern);
      if (__instapaper_matches && __instapaper_matches.length == 2)
      {
        if (__instapaper_matches[0].includes('ogp.me'))
          __instapaper_og_prefix = __instapaper_matches[1];
        else if (__instapaper_matches[0].includes('purl.org'))
          __instapaper_dc_prefix = __instapaper_matches[1];
      }
    }
  )
}


__instapaper_prexies = null;



// Fallback to commonly used default prefixes
__instapaper_og_prefix = __instapaper_og_prefix != null ? __instapaper_og_prefix : 'og';
__instapaper_od_prefix = __instapaper_dc_prefix != null ? __instapaper_dc_prefix : 'dc';



// Grab titles from Open Graph, Dublin Core, meta title, or fallback to the document title
if (__instapaper_og_prefix)
{
  __instapaper_title = (__instapaper_title = document.querySelector('meta[property~="' + __instapaper_og_prefix + ':title"][content]')) ? __instapaper_title.content : false;
}
if (!__instapaper_title && __instapaper_dc_prefix)
{
    __instapaper_title = (__instapaper_title = document.querySelector('meta[property~="' + __instapaper_dc_prefix + ':title"][content], meta[name="DC.title"][content]')) ? __instapaper_title.content : false;
}
if (!__instapaper_title)
{
  __instapaper_title = (__instapaper_title = document.querySelector('meta[name="title"][content]')) ?  __instapaper_title.content : false || document.title;
}


// Grab descriptions from Open Graph, Dublin Core, or meta description
if (__instapaper_og_prefix)
{
  __instapaper_descr = (__instapaper_descr = document.querySelector('meta[property~="' + __instapaper_og_prefix + ':description"][content]')) ? __instapaper_descr.content : false;
}
if (!__instapaper_descr && __instapaper_dc_prefix)
{
    __instapaper_descr = (__instapaper_descr = document.querySelector('meta[property~="' + __instapaper_dc_prefix + ':description"][content], meta[name="DC.description"][content]')) ? __instapaper_descr.content : false;
}
if (!__instapaper_descr)
{
  __instapaper_descr = (__instapaper_descr = document.querySelector('meta[name="description"][content]')) ?  __instapaper_descr.content : false || null;
}


// Grab URLs from Open Graph (HTML5 standard link method, then meta), or the canonical link
if (__instapaper_og_prefix)
{
   __instapaper_url = (__instapaper_url = document.querySelector('link[property~="' + __instapaper_og_prefix + ':url"][type="text/html"][href], link[property~="' + __instapaper_og_prefix + ':url"][href]')) ? __instapaper_url.href : false;
}
if (!__instapaper_url && __instapaper_og_prefix)
{
    __instapaper_url = (__instapaper_url = document.querySelector('meta[property~="' + __instapaper_og_prefix + ':url"][content]')) ? __instapaper_url.content : false;
}
if (!__instapaper_url)
{
    __instapaper_url = (__instapaper_url = document.querySelector('link[rel~="canonical"][type="text/html"][href], link[rel~="canonical"][href]')) ? __instapaper_url.href : null;
}


__instapaper_og_prefix = null;
__instapaper_dc_prefix = null;


[__instapaper_url, __instapaper_title,__instapaper_descr, document.body.parentElement.outerHTML];