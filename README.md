# Pluto.jl Desktop
Wraps [Pluto.jl](https://github.com/fonsp/Pluto.jl) in a Desktop application for those who dislike working through a browser.

## Installation
*Prebuilt binary installers coming soon!*

Installation at the moment requires Node.js, electron, electron-builder, and Julia. Clone this repository and then package the application with `electron-builder` to build "from source".

## Future Improvements
Electron opens the door to a more unified experience between Pluto.jl and the OS. From this arises the potential for improvements to vanilla Pluto.jl which would otherwise be impossible, such as...
* Native file picker
* Default app for opening `.pluto.jl` files
* Automated installation on machines without Julia already installed
