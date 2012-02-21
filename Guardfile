guard :shell do
  watch(%r{^less/(.+\.less)$}) do |m|
    full_path = m[0]
    file_name = m[1]
    file_name_dir = file_name.split('/')[0..-2].join('/')
    puts "LESS: #{full_path}"
    system("mkdir -p css/#{file_name_dir}")
    system("./node_modules/less/bin/lessc #{full_path} css/#{file_name.sub(/\.less$/,'.css')}")
  end
end

