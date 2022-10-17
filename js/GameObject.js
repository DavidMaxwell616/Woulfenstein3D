function GameObject(spritesheet, x, y, width, height, scale,
    numberOfColumns, numberOfRows, frameCount, timePerFrame, startFrame, endFrame) {
    this.spritesheet = spritesheet;             //the spritesheet image
    this.x = x;                                 //the x coordinate of the object
    this.y = y;                                 //the y coordinate of the object
    this.width = width;                         //width of spritesheet
    this.height = height;                       //height of spritesheet
    this.timePerFrame = timePerFrame;           //time in(ms) given to each frame
    this.numberOfColumns = numberOfColumns || 1;  //number of columns in the spritesheet, default 1
    this.numberOfRows = numberOfRows || 1;  //number of rows in the spritesheet, default 1
    this.scale = scale;
    this.row = 0;
    this.startFrame = startFrame;
    this.endFrame = endFrame;
    this.frameIndex = startFrame;
    this.numberOfFrames = frameCount;
    //time the frame index was last updated
    this.lastUpdate = Date.now();
    this.animation = [];
    //to update
    this.update = function() {
        if(Date.now() - this.lastUpdate >= this.timePerFrame) {
            this.frameIndex++;
            if(this.frameIndex >= this.numberOfFrames) {
                this.frameIndex = 0;
            }
            this.lastUpdate = Date.now();
        }
    }

    //to draw on the canvas, parameter is the context of the canvas to be drawn on
    this.draw = function(context) {
         context.drawImage(this.spritesheet,
                          this.frameIndex*this.width,
                          this.height*this.row,
                          this.width,
                          this.height,
                          x,
                          y,
                          this.width*this.scale,
                          this.height*this.scale);
    }
}