(function(){


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Film Variables
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var vote_settings       = { publish_key : 'demo', subscribe_key : 'demo' }
,   vote_channel        = PUBNUB.$('film-vote-channel').innerHTML
,   pubnub              = PUBNUB.init(vote_settings)
,   film_display        = PUBNUB.$('film-display')
,   film_template       = PUBNUB.$('film-template').innerHTML
,   film_data           = PUBNUB.$('film-data').innerHTML
,   film_data_cols      = PUBNUB.$('film-data-columns').innerHTML
,   film_display_buffer = []
,   films               = parse_film_file( film_data, film_data_cols );


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* RENDER FILMS
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
PUBNUB.each( films, function(film) {
    film_display_buffer.push(PUBNUB.supplant( film_template, film ));
} );
film_display.innerHTML = film_display_buffer.join('');


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* VOTING CLICKS
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
delegate( film_display, 'clicks' );

PUBNUB.events.bind( 'clicks.vote', function(data) {
    pubnub.publish({ channel : vote_channel, message : data });
} );


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* PARSE FILM FILE
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


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// GET ELEMENT ACTION DATA ATTRIBUTE AND FIRE ASSOCIATED EVENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function delegate( element, namespace ) {
    PUBNUB.bind( 'mousedown,touchstart', element, function(e) {
        var data   = bubblefind( e, 'data-data' )
        ,   action = bubblefind( e, 'data-action' );
        if (!action) return true;
        PUBNUB.events.fire( namespace + '.' + action, {
            action : action,
            data   : data
        } );
    } );
}

function bubblefind( e, attr ) {
    var target = e.target || e.srcElement || {}
    ,   result = '';
    while (target) {
        result = PUBNUB.attr( target, attr );
        if (result) return result;
        target = target.parentNode;
    }
}

function first_div(elm)  { return elm.getElementsByTagName('div')[0]    }


})();
