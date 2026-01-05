const mainFile = document.getElementById('main');
const navItems = document.querySelectorAll('.nav-item .nav-item-text');
const btnshowMore = document.querySelector('.show-more');

window.onload = async () => {
    let defaultTab = 'personal-info';
    if (location.hash.length > 1) {
        defaultTab = location.hash.replace('#', '');
    }
    //to mau lai tab hien tai khi load lai trang
    const currentTab = document.querySelector(`.nav-item .nav-item-text[href="#${defaultTab}"]`);
    if (currentTab) {
        currentTab.classList.add('active');
    }
    await loadTab(defaultTab)
};
// Thêm sự kiện click cho tất cả các nav-item
navItems.forEach((navItem) => {
    (navItem as HTMLElement).onclick = async () => {
        let tabId = navItem.getAttribute('href')?.replace('#', '');
        // Xóa class active của tất cả các nav-item
        if(tabId){
        navItems.forEach((item) => {
            item.classList.remove('active');
        });
        // Thêm class active vào nav-item được click
        navItem.classList.add('active')
        await loadTab(tabId || '');
        }
        else{
            //nut show more
            btnshowMore?.classList.toggle('active');
        }
    };
});
const tabData = {
    'personal-info': '',
    'skills': '',
    'projects': ''
};
async function loadTab(tabId: string) {
    if (!tabId) return;
    if(!tabData[tabId])
    {
        const res = await fetch(`./tabs/${tabId}.html`);
        tabData[tabId] = await res.text();
    }
    if (mainFile) {
        mainFile.innerHTML = tabData[tabId];
    }
}
