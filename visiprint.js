/*
 * Javascript port of OpenSSH6's key.c randomart
 * 
 * Generates a numerical "fingerprint" bitmap of sorts
 * 
 * Rather than characters it simply uses numbers between 0 and num_levels
 */

visiprint = {
    DEFAULT_WIDTH: 32, 
    DEFAULT_HEIGHT: 32,
    DEFAULT_NUMLEVELS: 8,
    
    sample_colors: [
        [0, 0, 0],
        [32, 128, 128],
        [128, 128, 255],
        [255, 255, 0],
        [0, 0, 255],
        [200, 0, 255],
        [128, 128, 0],
        [128, 0, 0],
        [128, 0, 128],
        [0, 128, 128],
        [0, 0, 128],
        [128, 69, 69],
        [64, 192, 192],
        [0, 64, 192],
        [128, 64, 192],
        [160, 64, 255],
    ],
    
    sample_characters: " .o+=*BO",

    fingerprint_randomart: function (dgst_raw, num_levels, width, height) {
        /* fingerprint_randomart(dgst_raw, num_levels=8, width=16, height=16)
         * 
         * Takes a latin1 string of 8bit bytes and returns a 2D array of 
         *  numbers (between 0 and num_levels) of size width * height.
         * 
         * optional:
         *  num_levels, output value range, defaults to 8
         *  width: width of output, defaults to 16
         *  height: height of output, defaults to 16
         * 
         * Sizes which are too small (less than eight)
         *      may be too dense and fail or be useless.
         */

        var num_levels = num_levels ? num_levels : this.DEFAULT_NUMLEVELS
        var width = width ? width : this.DEFAULT_WIDTH
        var height = height ? height : this.DEFAULT_HEIGHT
        
        var retval = []
        var p = []
        var field = new Array(width)
        var i, b
        var x, y

        for (x = 0; x < width; x++) {
            field[x] = new Array(height)
            for (y = 0; y < height; y++) {
                field[x][y] = 0
            }
        }

        x = Math.floor(width / 2)
        y = Math.floor(height / 2)

        /* process raw key */
        for (i = 0; i < dgst_raw.length; i++) {
            /* each byte conveys 4 2-bit move commands */
            var input = dgst_raw.charCodeAt(i)
            for (b = 0; b < 4; b++) {
                /* evaluate 2 bit, rest is shifted later */
                x += (input & 0x1) ? 1 : -1
                y += (input & 0x2) ? 1 : -1

                /* assure we are still in bounds */
                x = Math.max(x, 0)
                y = Math.max(y, 0)
                x = Math.min(x, width - 1)
                y = Math.min(y, height - 1)

                /* augment the field */
                if (field[x][y] < num_levels - 2) {
                    field[x][y]++
                }
                input = input >> 2
            }
        }
        
        return {
            data: field,
            input: dgst_raw,
            num_levels: num_levels,
            width: width,
            height: height
        }
    },

    colorval: function (color) {
        return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
    },

    canvas_fingerprint: function (canvas, fingerprint, colors, scale) {
        /* canvas_fingerprint(canvas, fingerprint, colors, scale=1.0) 
         * 
         * Output a fingerprint to a canvas
         * 
         * canvas is a canvas element
         * 
         * colors is a list of colors to use for drawing.
         *   Values from the fingerprint are mapped directly to it as:
         *          colors[value], where a color is a 3 value array in rbg
         * 
         * optional:
         *   scale informs the renderer to scale up X units
         */

        if (!canvas.getContext) {
            return
        }

        var scale = scale ? scale : 1

        canvas.width = fingerprint.width * scale
        canvas.height = fingerprint.height * scale

        var x, y
        var r, g, b;
        var c = canvas.getContext('2d')
        var imageData = c.createImageData(fingerprint.width, fingerprint.height)
        c.scale(scale, scale)
        c.fillStyle = this.colorval(colors[0])
        c.fillRect(0, 0, fingerprint.width, fingerprint.height)
        for (y = 0; y < fingerprint.height; y++) {
            for (x = 0; x < fingerprint.width; x++) {
                var val = fingerprint.data[x][y]
                if (val != 0) {
                    c.fillStyle = this.colorval(colors[val])
                    c.fillRect(x, y, 1, 1)
                }
            }
        }

    },

    text_fingerprint: function (fingerprint, characters) {
        /* text_fingerprint(fingerprint, characters)
         * 
         * characters is a string of characters with a length 
         *      outputted characters are mapped with the string
         *      from the fingerprint values.
         * 
         * Returns a string from a fingerprint
         */

        var x, y
        var output = ""

        for (y = 0; y < fingerprint.height; y++) {
            for (x = 0; x < fingerprint.width; x++) {
                output += characters[fingerprint.data[x][y]]
            }
            if (y < fingerprint.height - 1) {
                output += "\n"
            }
        }
        return output
    }
}
