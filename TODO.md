# TODO

## Performance Improvements

- Automatically keep track of what data needs to preload to play/preview content
    - Cache content in Redis(?)
    - This might be easier to do in 1MB blocks
        - Actually that would be huge across 100,000 of files...
        - Might have to implement an LRU cache
    - Would this actually improve performance though?...
        - Disks wouldn't spin up, Drive wouldn't re-auth, etc. ...
