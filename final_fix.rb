require 'fileutils'

# Configuration
DIST_DIR = 'dist'
INDEX_HTML = File.join(DIST_DIR, 'index.html')
ASSETS_DIR = File.join(DIST_DIR, 'assets')

def log(msg)
  puts "[Fixer] #{msg}"
end

unless Dir.exist?(DIST_DIR)
  log "Error: dist directory not found. Cannot patch."
  exit 1
end

# 1. Patch JS for Default View 'Day'
js_files = Dir.glob(File.join(ASSETS_DIR, 'index-*.js'))
if js_files.empty?
  log "Error: No JS bundle found in assets."
else
  js_file = js_files.first
  content = File.read(js_file)
  
  if content.include?('useState("day")')
    log "JS bundle already defaults to 'Day' view."
  elsif content.match?(/useState\(new Date\),\[.{1,3},.{1,3}\]=.{1,3}\.useState\("month"\)/)
    new_content = content.sub(/(useState\(new Date\),\[.{1,3},.{1,3}\]=.{1,3}\.useState\()"month"(\))/, '\1"day"\2')
    File.write(js_file, new_content)
    log "Successfully patched JS bundle to default to 'Day' view."
  end
end

# 2. Patch HTML with RIGID FLEX 3-BLOCK LAYOUT
if File.exist?(INDEX_HTML)
  html_content = File.read(INDEX_HTML)
  
  html_content.gsub!(/<style id="HOTFIX_STYLE">.*?<\/style>/m, '')
  html_content.gsub!(/<script id="REDIRECT_FIX">.*?<\/script>/m, '')
  
  css_patch = <<~CSS
    <style id="HOTFIX_STYLE">
    @media (min-width: 1280px) { /* xl breakpoint */
      
      /* Desktop header container */
      header > div > div:last-child {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        height: 100% !important;
        gap: 0 !important;
      }
      
      /* Logo Block (Child 1) - Fixed 300px */
      header > div > div:last-child > div:first-child {
         width: 300px !important;
         min-width: 300px !important;
         flex-shrink: 0 !important;
         display: flex !important;
         align-items: center !important;
         justify-content: flex-start !important;
      }

      /* Nav Block (Child 2) - Flexible center */
      header > div > div:last-child > nav {
         flex: 1 !important;
         display: flex !important;
         justify-content: center !important;
         align-items: center !important;
         gap: 0.5rem !important;
         padding: 0 1rem !important;
         opacity: 1 !important;
         visibility: visible !important;
      }
      
      /* Nav items visibility */
      header > div > div:last-child > nav > div,
      header > div > div:last-child > nav a {
         opacity: 1 !important;
         visibility: visible !important;
         display: flex !important;
      }

      /* User Block (Child 3) - Fixed 300px */
      header > div > div:last-child > div:last-child {
         width: 300px !important;
         min-width: 300px !important;
         flex-shrink: 0 !important;
         display: flex !important;
         align-items: center !important;
         justify-content: flex-end !important;
      }
    }
    </style>
  CSS
  
  
  script_patch = <<~SCRIPT
    <script id="REDIRECT_FIX">
    (function() {
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.history.replaceState(null, '', '/agenda');
      }
    })();
    </script>
  SCRIPT
  
  if html_content.include?("</head>")
    html_content.sub!("</head>", "#{css_patch}\n#{script_patch}\n</head>")
    File.write(INDEX_HTML, html_content)
    log "Successfully patched index.html with RIGID FLEX 3-BLOCK Layout."
  else
    log "Error: </head> tag not found."
  end
else
  log "Error: index.html not found."
end
