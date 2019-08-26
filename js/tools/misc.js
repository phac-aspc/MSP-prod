// converts a 2d array into JSON
Array.prototype.toJSON = function(){
    var values = [];
    
    for (var i=1;i<this.length;i++){
        var obj = {};

        for (var k=0; k<this[0].length;k++){
            
            var key = this[0][k].toLowerCase();
            var value = this[i][k];
            
            obj[key] = value || "";
        }
        
        values.push(obj);
    }

    return values;
};