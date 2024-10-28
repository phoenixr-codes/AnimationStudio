require 'pathname'

PREBUILD = Pathname.new(ENV.fetch('ALLAY_PREBUILD'))
BP = PREBUILD.join("BP")
RP = PREBUILD.join("RP")
SP = PREBUILD.join("SP")
WT = PREBUILD.join("WT")

[BP, RP, SP, WT].each do |path|
  next if not path.exist?
  readme = path.join("README.txt")
  File.open(readme, "w") { |f| f.write %{
Hello there explorer!

This add-on's content is highly obfuscated and minified. If you
want to see the full source code of this project, visit

-> https://github.com/phoenixr-codes/AnimationStudio
}}
end
