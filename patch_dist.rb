
file_path = 'dist/index.html'

if File.exist?(file_path)
  content = File.read(file_path)
  
  if content.include?("HOTFIX_STYLE")
    puts "Already patched. Skipping."
  else
    # The CSS payload to fix the layout
    # We use position: static so justify-between handles spacing naturally
    style_block = %q{<style id="HOTFIX_STYLE">
    @media (min-width: 1024px) {
      /* Force Nav to sit between items instead of on top */
      nav[class*="xl:flex"] {
        position: static !important;
        transform: none !important;
        margin: 0 auto !important;
        width: auto !important;
        max-width: none !important;
        justify-content: center !important;
        display: flex !important;
        gap: 0 !important;
      }
      
      /* Ensure children fit */
      nav[class*="xl:flex"] > div {
         gap: 0 !important; 
      }
      
      /* Shrink links */
      nav[class*="xl:flex"] a {
        min-width: 0 !important;
        padding: 4px 6px !important;
        flex: 1 1 auto !important;
      }
      
      /* Force single line text */
      nav[class*="xl:flex"] span {
        font-size: 11px !important;
        white-space: nowrap !important;
        letter-spacing: 0 !important;
      }
      
      /* Shrink icons */
      nav[class*="xl:flex"] svg {
        width: 18px !important;
        height: 18px !important;
      }
      
      /* Drastically reduce the central button wrapper space */
      nav[class*="xl:flex"] > div.mx-8 {
        margin: 0 4px !important;
        transform: scale(0.85) !important;
      }
    }
    </style>}

    # Inject before closing head tag
    new_content = content.sub("</head>", style_block + "</head>")
    
    File.write(file_path, new_content)
    puts "Successfully patched dist/index.html with HTML Hotfix."
  end
else
  puts "Error: dist/index.html not found."
end
