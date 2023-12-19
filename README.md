# ScriptReader - app,that watch changes of scripts.txt file,then reads its content(scripts) and then interacts with file system module
## General view of script : callName operation path data(data in most cases optional,but in some is a must)
## some script cases:
### to make dir,create file in it,and append content to file:
    dir make dir
    file create ./dir/data.txt content
    file append ./dir/data.txt more content!
    file append ./dir/data.txt ...
### to delete file:
    file delete ./dir/data.txt
