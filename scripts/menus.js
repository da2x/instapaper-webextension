// Global menu states
var this_menu_instance_id = 0,
    next_menu_instance_id = 1;


browser.menus.create({
  id: 'menu-read-now',
  title: 'Read Now',
  contexts: ['link', 'page']
});
browser.menus.create({
  id: 'menu-read-later',
  title: 'Read Later',
  contexts: ['link', 'page']
});
browser.menus.create({
  id: 'menu-read-later-close',
  title: 'Read Later and Close',
  contexts: ['page']
});


browser.menus.onClicked.addListener((info, tab) =>
  {
    if (info && (info.linkUrl || info.pageUrl))
    {
      var linkToRead = info.linkUrl || info.pageUrl,
      read_it_now = info.menuItemId == 'menu-read-now',
      open_in_new_tab = info.modifiers.includes('Shift'),
      open_no_saving =  info.modifiers.includes('Alt'),
      save_and_close = (info.menuItemId == 'menu-read-later-close'),
      save_for_later = (info.menuItemId == 'menu-read-later' || save_and_close);

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
          saveLink(linkToRead, !save_for_later, save_and_close, open_in_new_tab, tab.id);
        }
      }
    }
  }
);


browser.menus.onShown.addListener((info, tab) =>
  {
    var this_menu_instance_id = next_menu_instance_id++;
    next_menu_instance_id = this_menu_instance_id;

    // Disable Read now on private tab
    browser.menus.update('menu-read-now', {enabled: (!tab.incognito)});

    // took too long, another menu is being displayed
    if (this_menu_instance_id !== next_menu_instance_id) {
      return;
    }
    browser.menus.refresh();
  }
);