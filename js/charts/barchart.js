class BarChart {
    constructor(xScale) {
        this.x = xScale;
    }
    
    draw(target, value) {
        var WIDTH = $(target).width();
        var formatter = d3.format(",");
        
        var context = d3.selectAll(target);
        
        context.selectAll('.bar')
            .data([value])
            .enter()
            .append('g')
            .attr('class', 'bar')
            .append('rect');

        context.select('.bar')
            .selectAll('text')
            .data([value])
            .enter()
            .append('text')
            .attr("dy", "1.2em")
            .attr("text-anchor", "right")
            .style("fill", "green");
 
        context.selectAll('.bar')
            .select('rect')
            .style('fill', '#ffa502')
            .transition()
            .duration(1000)
            .attr("x", 0)
            .attr("y", 0)
            .attr('width', function(d){return this.x(d); })
            .attr('height', 40);

        context.selectAll('.bar').select('text')
            .transition()
            .duration(1000)
            .tween("text", function(d){
                var el = d3.select(this);
                var interpolator = d3.interpolate(el.text().replace("$", "").replace(",", "").replace(",", ""), d);
                return function(t){
                    el.text("$" + formatter(interpolator(t).toFixed(0)));
                };
            })
            .attr("x", function(d){return this.x(d) + 10;});
    }
}
