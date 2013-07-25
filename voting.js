(function(){

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Film Variables
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var film_display   = PUBNUB.$('film-display')
,   film_template  = PUBNUB.$('film-template').innerHTML
,   film_data      = PUBNUB.$('film-data').innerHTML
,   film_data_cols = PUBNUB.$('film-data-columns').innerHTML
,   films          = parse_film_file( film_data, film_data_cols );

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Render Films
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var film_display_buffer = [];
PUBNUB.each( films, function(film) {
    if (!('image' in film)) console.log(film,'!!!!!!!!!!');
    film_display_buffer.push(PUBNUB.supplant( film_template, film ));
} );
film_display.innerHTML = film_display_buffer.join('');

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Parse Film File
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
function parse_film_file( data, format ) {
    var format = format.split(/\t/);
    return data.split(/\n/).map(function(row){
        var film = {};
        PUBNUB.each( row.split(/\t/), function( column, position ) {
            film[format[position]] = column;
        } );
        return film;
    });
}

})();
