/*
    CV Online - Tab Navigation System
    Features:
    - Smooth page transitions with fade effects
    - Tab caching for better performance
    - LocalStorage persistence
    - Hash-based routing
*/

const mainEl = document.getElementById('main');
const navNodeList = document.querySelectorAll('.nav-item .nav-item-text');
const btnShowMore = document.querySelector('.show-more');
const TAB_KEY = 'selectedTabId';
const tabCache = {};

function getNavArray() {
    return Array.from(navNodeList);
}

// Add transition classes to main element
if (mainEl) {
    mainEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
}

// Restore tab on load (hash preferred)
window.addEventListener('load', async function () {
    let tabId = 'personal-info';

    // Check URL hash first
    if (location.hash && location.hash.length > 1) {
        tabId = location.hash.replace('#', '');
    } else {
        // Check localStorage
        const saved = localStorage.getItem(TAB_KEY);
        if (saved) tabId = saved;
    }

    // Set active nav item
    const nav = document.querySelector(`.nav-item .nav-item-text[href="#${tabId}"]`);
    if (nav) {
        getNavArray().forEach(n => n.classList.remove('active'));
        nav.classList.add('active');
    }

    // Load initial tab
    await loadTab(tabId, false);
});

// Attach click handlers to navigation items
getNavArray().forEach(function (nav) {
    nav.addEventListener('click', async function (e) {
        e.preventDefault();

        const href = nav.getAttribute('href') || '';
        const id = href.replace('#', '');

        // Handle "show more" button (no id)
        if (!id) {
            if (btnShowMore) {
                btnShowMore.classList.toggle('active');
            }
            return;
        }

        // Update active state
        getNavArray().forEach(n => n.classList.remove('active'));
        nav.classList.add('active');

        // Save to localStorage
        localStorage.setItem(TAB_KEY, id);

        // Load tab with transition
        await loadTab(id, true);
    });
});

// Load tab content with caching and smooth transitions
async function loadTab(tabId, withTransition = true) {
    if (!tabId || !mainEl) return;

    // Fade out animation
    if (withTransition) {
        mainEl.style.opacity = '0';
        mainEl.style.transform = 'translateY(20px)';
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Check cache first
    if (tabCache[tabId]) {
        mainEl.innerHTML = tabCache[tabId];
    } else {
        // Fetch new content
        try {
            const res = await fetch(`tabs/${tabId}.html`);

            if (!res.ok) {
                console.warn('Không thể load tab:', tabId, res.status);
                mainEl.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: #7f8c8d;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Không thể tải nội dung</h3>
                        <p>Vui lòng thử lại sau.</p>
                    </div>
                `;
                return;
            }

            const html = await res.text();
            tabCache[tabId] = html;
            mainEl.innerHTML = html;

        } catch (err) {
            console.error('Lỗi khi load tab', tabId, err);
            mainEl.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #e74c3c;">
                    <i class="fas fa-times-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Đã xảy ra lỗi</h3>
                    <p>${err.message}</p>
                </div>
            `;
            return;
        }
    }

    // Update URL hash
    try {
        history.replaceState(null, null, '#' + tabId);
    } catch (e) {
        location.hash = '#' + tabId;
    }

    // Fade in animation
    if (withTransition) {
        await new Promise(resolve => setTimeout(resolve, 50));
        mainEl.style.opacity = '1';
        mainEl.style.transform = 'translateY(0)';
    } else {
        mainEl.style.opacity = '1';
        mainEl.style.transform = 'translateY(0)';
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', async function () {
    const tabId = location.hash.replace('#', '') || 'personal-info';

    // Update active nav
    const nav = document.querySelector(`.nav-item .nav-item-text[href="#${tabId}"]`);
    if (nav) {
        getNavArray().forEach(n => n.classList.remove('active'));
        nav.classList.add('active');
    }

    // Load tab
    await loadTab(tabId, true);
});

// Close "show more" menu when clicking outside
document.addEventListener('click', function (e) {
    if (btnShowMore && btnShowMore.classList.contains('active')) {
        const isClickInside = btnShowMore.contains(e.target) ||
            e.target.closest('.nav-item-text[href="#"]');
        if (!isClickInside) {
            btnShowMore.classList.remove('active');
        }
    }
});

/* =============================================
   PDF DOWNLOAD FUNCTIONALITY
   ============================================= */

// Function to generate PDF from content
async function generatePDF(tabs, filename, language = 'vi') {
    const allContent = document.createElement('div');
    allContent.style.backgroundColor = 'white';
    allContent.style.padding = '20px';
    allContent.style.fontFamily = 'Arial, sans-serif';

    let successCount = 0;

    for (const tabId of tabs) {
        const tabFile = language === 'en' ? `${tabId}-en` : tabId;

        // Load tab if not cached
        if (!tabCache[tabFile]) {
            try {
                const res = await fetch(`tabs/${tabFile}.html`);
                if (res.ok) {
                    tabCache[tabFile] = await res.text();
                    console.log(`✓ Loaded: ${tabFile}.html`);
                } else {
                    console.error(`✗ Failed to load: ${tabFile}.html (Status: ${res.status})`);
                    continue;
                }
            } catch (err) {
                console.error(`✗ Error loading ${tabFile}:`, err);
                continue;
            }
        }

        // Add tab content
        if (tabCache[tabFile]) {
            const tabDiv = document.createElement('div');
            tabDiv.innerHTML = tabCache[tabFile];
            tabDiv.style.pageBreakAfter = 'always';
            tabDiv.style.marginBottom = '20px';

            // Fix relative image paths
            const images = tabDiv.querySelectorAll('img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('../')) {
                    img.setAttribute('src', src.replace('../', ''));
                }
            });

            // Remove all animations and transitions to prevent blur/missing content
            const allElements = tabDiv.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.animation = 'none';
                el.style.animationDelay = '0s';
                el.style.transition = 'none';
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.visibility = 'visible';
            });

            // Ensure slide-in elements are visible
            const slideInElements = tabDiv.querySelectorAll('.slide-in, .fade-in');
            slideInElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.classList.remove('slide-in', 'fade-in');
            });

            allContent.appendChild(tabDiv);
            successCount++;
        }
    }

    // Validate that we have content
    if (successCount === 0) {
        throw new Error(language === 'en' ?
            'No content loaded. Please check if all tab files exist.' :
            'Không thể tải nội dung. Vui lòng kiểm tra lại các file tab.');
    }

    console.log(`✓ Successfully loaded ${successCount}/${tabs.length} sections`);

    // Append to body temporarily to ensure proper rendering
    allContent.style.position = 'absolute';
    allContent.style.left = '-9999px';
    allContent.style.top = '0';
    document.body.appendChild(allContent);

    // Wait for fonts and images to load
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 500));

    // PDF options - Maximum quality
    const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: {
            type: 'jpeg',
            quality: 1.0
        },
        html2canvas: {
            scale: 4,  // Increased from 3 to 4 for better quality
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            removeContainer: false,
            imageTimeout: 15000,  // Increased timeout
            width: 794,
            windowWidth: 794,
            onclone: function (clonedDoc) {
                // Ensure all cloned elements are visible
                const clonedElements = clonedDoc.querySelectorAll('*');
                clonedElements.forEach(el => {
                    el.style.animation = 'none';
                    el.style.transition = 'none';
                    el.style.opacity = '1';
                    el.style.visibility = 'visible';
                });
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: false
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // Generate PDF
        await html2pdf().set(opt).from(allContent).save();
    } finally {
        // Clean up: remove temporary element
        document.body.removeChild(allContent);
    }
}

// Download Vietnamese CV
document.getElementById('download-cv-vi')?.addEventListener('click', async function (e) {
    e.preventDefault();

    if (btnShowMore) btnShowMore.classList.remove('active');

    const originalHTML = mainEl.innerHTML;
    mainEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 1rem;">
            <div class="loading"></div>
            <p style="color: var(--text-light);">Đang tạo CV Tiếng Việt...</p>
        </div>
    `;

    try {
        const tabs = ['personal-info', 'skills', 'projects'];
        await generatePDF(tabs, 'CV_TranMinhDung_TiengViet.pdf', 'vi');

        // Restore content
        setTimeout(() => {
            mainEl.innerHTML = originalHTML;
        }, 1000);

    } catch (error) {
        console.error('Lỗi khi tạo PDF:', error);
        mainEl.innerHTML = originalHTML;
        alert('Có lỗi khi tạo file PDF. Vui lòng thử lại!');
    }
});

// Download English CV
document.getElementById('download-cv-en')?.addEventListener('click', async function (e) {
    e.preventDefault();

    if (btnShowMore) btnShowMore.classList.remove('active');

    const originalHTML = mainEl.innerHTML;
    mainEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 1rem;">
            <div class="loading"></div>
            <p style="color: var(--text-light);">Creating English CV...</p>
        </div>
    `;

    try {
        const tabs = ['personal-info', 'skills', 'projects'];
        await generatePDF(tabs, 'CV_TranMinhDung_English.pdf', 'en');

        // Restore content
        setTimeout(() => {
            mainEl.innerHTML = originalHTML;
        }, 1000);

    } catch (error) {
        console.error('Error creating PDF:', error);
        mainEl.innerHTML = originalHTML;
        alert('Error creating PDF file. Please try again!');
    }
});
