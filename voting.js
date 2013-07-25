(function(){


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Film Variables
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var vote_settings       = { publish_key : 'demo', subscribe_key : 'demo' }
,   vote_channel        = PUBNUB.$('film-vote-channel').innerHTML
,   pubnub              = PUBNUB.init(vote_settings)
,   my_uuid             = get_my_uuid()
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
    var button  = data.target.getElementsByTagName('a')[0]
    ,   filmbox = data.target.parentNode
    ,   disable = 'btn btn-large btn-block btn-disable';

    // Prevent Douplicate Votes
    if (pubnub.attr( button, 'data-voted' )) return;
    pubnub.attr( button, 'data-voted', 'true' );

    // Disable Button Interface
    PUBNUB.attr( button, 'class', disable );
    button.className = disable;

    // Disable Film Box
    PUBNUB.css( filmbox, {
        opacity    : 0.2,
        background : "#87f496",
        color      : "#fff"
    } );

    // Debug
    console.log( data );

    // Deliver Vote
    pubnub.publish({ channel : vote_channel, message : {
        uuid   : my_uuid,
        film   : data.data,
        action : data.action
    } });
    
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

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* GET MY UUID
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
function get_my_uuid() {
    var my_uuid = PUBNUB.db.get('my-uuid') || PUBNUB.uuid();
    PUBNUB.db.set( 'my-uuid', my_uuid );
    return my_uuid;
}


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// GET ELEMENT ACTION DATA ATTRIBUTE AND FIRE ASSOCIATED EVENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function delegate( element, namespace ) {
    PUBNUB.bind( 'click', element, function(e) {
        var data   = bubblefind( e, 'data-data' )
        ,   action = bubblefind( e, 'data-action' );
        if (!action) return true;
        PUBNUB.events.fire( namespace + '.' + action.result, {
            action : action.result,
            target : action.target,
            data   : data.result
        } );
    } );
}

function bubblefind( e, attr ) {
    var target = e.target || e.srcElement || {}
    ,   result = '';
    while (target) {
        result = PUBNUB.attr( target, attr );
        if (result) return { result : result, target : target };
        target = target.parentNode;
    }
}

function first_div(elm)  { return elm.getElementsByTagName('div')[0]    }


})();
