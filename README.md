# ScriptReader - app,that watch changes of scripts.txt file,then reads its content(scripts) and then interacts with file system module
## General view of script : callName operation path data(in most cases optional,but in some is a must)
## some script cases:
### to make dir,create file in it,and append content to file:
    1.dir create dir
    2.file create ./dir/data.txt content
    3.file append ./dir/data.txt more content!
    4.file append ./dir/data.txt ...
### to delete file:
    1.file delete ./dir/data.txt
