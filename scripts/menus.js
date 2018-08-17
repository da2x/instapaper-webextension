// Global menu states
var this_menu_instance_id = 0,
    next_menu_instance_id = 1;


browser.menus.create({
  id: 'menu-read-now',
  title: 'Read Now',
  contexts: ['page']
});
browser.menus.create({
  id: 'menu-read-later',
  title: 'Read Later',
  contexts: ['page']
});
browser.menus.create({
  id: 'menu-read-later-close',
  title: 'Read Later and Close',
  contexts: ['page']
});


browser.menus.onClicked.addListener((info, tab) =>
  {
    if (info && info.pageUrl)
    {
      var linkToRead = info.pageUrl,
      read_it_now = info.menuItemId == 'menu-read-now',
      open_in_new_tab = info.modifiers.includes('Shift'),
      open_no_saving =  info.modifiers.includes('Alt'),

      options =
      {
        save_and_open: read_it_now,
        save_and_close: (info.menuItemId == 'menu-read-later-close'),
        open_in_new_tab: open_no_saving
      };

      if (linkToRead && isFirefoxReaderViewUrl(linkToRead))
      {
        linkToRead = firefoxReaderViewToUrl(linkToRead);
      }
      if (linkToRead && isWebUrl(linkToRead))
      {
        if (read_it_now && open_no_saving)
        {
          openLink(open_in_new_tab, tab.id, URL_READ_URL + encodeURIComponent(linkToRead))
        }
        else
        {
          saveLink(linkToRead, null, options, tab.id);
        }
      }
    }
  }
);


browser.menus.onShown.addListener(async (info, tab) =>
  {
    var this_menu_instance_id = next_menu_instance_id++;
    next_menu_instance_id = this_menu_instance_id,
    reading_menus_enabled = false;

    if (tab && tab.url)
    {
      var url = tab.url;
      if (isFirefoxReaderViewUrl(url))
      {
        url = firefoxReaderViewToUrl(url);
      }
      if (url && isWebUrl(url) && !isInstapaperReadingUrl(url))
      {
        reading_menus_enabled = true;
      }
    }

    await browser.menus.update('menu-read-now', {enabled: (!tab.incognito && reading_menus_enabled)});
    await browser.menus.update('menu-read-later', {enabled: reading_menus_enabled});
    await browser.menus.update('menu-read-later-close', {enabled: reading_menus_enabled});

    // took too long, another menu is being displayed
    if (this_menu_instance_id !== next_menu_instance_id)
    {
      return;
    }
    browser.menus.refresh();
  }
);