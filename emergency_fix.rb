require 'fileutils'

# Emergency fix for header layout
DIST_DIR = 'dist'
INDEX_HTML = File.join(DIST_DIR, 'index.html')

def log(msg)
  puts "[Emergency Fix] #{msg}"
end

unless File.exist?(INDEX_HTML)
  log "Error: index.html not found."
  exit 1
end

html_content = File.read(INDEX_HTML)

# Remove any existing hotfix styles
html_content.gsub!(/\<style id="HOTFIX_STYLE"\>.*?\<\/style\>/m, '')
html_content.gsub!(/\<style id="EMERGENCY_FIX"\>.*?\<\/style\>/m, '')

# Inject aggressive CSS that targets all possible selectors
emergency_css = <<~CSS
  <style id="EMERGENCY_FIX">
  /* Force desktop header layout - Emergency Fix */
  @media (min-width: 1280px) {
    /* Target the desktop header wrapper */
    header > div > div.hidden.xl\\:flex,
    header > div > div[class*="xl:flex"] {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      width: 100% !important;
      gap: 0 !important;
    }
    
    /* First child - Logo block */
    header > div > div.hidden.xl\\:flex > div:first-child,
    header > div > div[class*="xl:flex"] > div:first-child {
      width: 300px !important;
      min-width: 300px !important;
      max-width: 300px !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }
    
    /* Second child - Nav block */
    header > div > div.hidden.xl\\:flex > nav,
    header > div > div[class*="xl:flex"] > nav {
      flex: 1 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    /* Third child - User block */
    header > div > div.hidden.xl\\:flex > div:last-child,
    header > div > div[class*="xl:flex"] > div:last-child {
      width: 300px !important;
      min-width: 300px !important;
      max-width: 300px !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }
    
    /* Ensure nav items are visible */
    header nav a,
    header nav div {
      opacity: 1 !important;
      visibility: visible !important;
    }
  }
  </style>
CSS

if html_content.include?("</head>")
  html_content.sub!("</head>", "#{emergency_css}\n</head>")
  File.write(INDEX_HTML, html_content)
  log "Successfully applied emergency CSS fix."
else
  log "Error: </head> tag not found."
  exit 1
end
