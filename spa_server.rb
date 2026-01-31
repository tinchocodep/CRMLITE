require 'webrick'

root = File.expand_path('dist')
server = WEBrick::HTTPServer.new(
  Port: 8080,
  DocumentRoot: root
)

# Custom servlet to handle SPA routing
class SPAServlet < WEBrick::HTTPServlet::FileHandler
  def do_GET(req, res)
    super
  rescue WEBrick::HTTPStatus::NotFound
    # If file not found, serve index.html for SPA routing
    res.body = File.read(File.join(@root, 'index.html'))
    res['Content-Type'] = 'text/html'
  end
end

server.mount('/', SPAServlet, root)

trap('INT') { server.shutdown }

puts "Server running at http://localhost:8080"
puts "Press Ctrl+C to stop"

server.start
