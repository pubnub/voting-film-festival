(function(){


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* Film Variables
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var vote_settings       = { publish_key : 'demo', subscribe_key : 'demo' }
,   vote_totals         = {}
,   vote_dedupe         = {}
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
delegate( film_display, 'film-clicks' );

PUBNUB.events.bind( 'film-clicks.vote', function(data) {
    var button  = data.target.getElementsByTagName('a')[0]
    ,   filmbox = data.target.parentNode;

    // Prevent Douplicate Votes
    if (pubnub.attr( button, 'data-voted' )) return;

    // Disable Voting Visually
    disable_voting_box( button, filmbox );

    // Deliver Vote
    pubnub.publish({ channel : vote_channel, message : {
        uuid   : my_uuid,
        film   : data.data,
        action : data.action
    } });
    
} );

function disable_voting_box( button, filmbox ) {
    var disable = 'btn btn-large btn-block disabled';

    // Disable Button
    pubnub.attr( button, 'data-voted', 'true' );

    // Disable Button Interface
    PUBNUB.attr( button, 'class', disable );
    button.className = disable;
    button.innerHTML = "DONE";

    // Disable Film Box
    PUBNUB.css( filmbox, { opacity : 0.6 } );
}


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* ...
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* NAVIGATION CLICKS
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var nav_template = PUBNUB.$('nav-template').innerHTML
,   categories   = PUBNUB.$('nav-categories')
                   .innerHTML
                   .replace( /\s/g, '' )
                   .split(',')
,   cat_disp_buf = []
,   navlist      = PUBNUB.$('navlist')
,   navigation   = PUBNUB.$('navigation');

// Build Navigation Categories
PUBNUB.each( categories, function(category) {
    cat_disp_buf.push(PUBNUB.supplant( nav_template, {
        nav : category
    } ));
} );
navlist.innerHTML = cat_disp_buf.join('');

// Start Delegation
delegate( navigation, 'nav-clicks' );

// Receive Delegated Events
PUBNUB.events.bind( 'nav-clicks.nav', function(data) {
    var category = data.data
    ,   films    = film_display.getElementsByTagName('div');

    console.log(data);

    PUBNUB.each( films, function(film) {
        var fcategory = PUBNUB.attr( film, 'data-category' );

        // Skip non-target DIVs
        if (!fcategory || categories.join(',').indexOf(
            fcategory
        ) === -1) return;

        // Hide
        if (fcategory !== category)
            PUBNUB.css( film, { display : 'none' } );
        else
            PUBNUB.css( film, { display : 'block' } );
    } );

} );


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* PARSE FILM FILE
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
function check_row(row) {
    return !row || (typeof(row) === "string" && row.charCodeAt(0) === 35);
}
function parse_film_file( data, format ) {
    var format = format.replace(/\s/g,'').split(/,/);
    return data.split(/\n/).map(function(row){
        // Ignore Comment Lines
        if (check_row(row)) return '';

        var film = {};
        PUBNUB.each( row.split(/\t/), function( column, position ) {
            film[format[position]] = column;
        } );

        return film;
    }).filter(function(row){
        // Prevent Rendering Comments
        console.log(row);
        return !check_row(row);
    });
}

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* SHOW VOTING TOTALS IF SECRET URL KEY IS ENABLED
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
// TODO
// TODO
// TODO


/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* VOTE COUNTING WITH MINOR DEDUPLICATION
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
pubnub.subscribe({
    channel : vote_channel,
    connect : tcp_stream_ready,
    message : vote_receiver
});

// Vote Receiver
function vote_receiver(vote) {
    if (!('film' in vote)) return;
    if (!('uuid' in vote)) return;

    var film_dedupe_key = vote.film + '-' + vote.uuid
    ,   flim_vote_count = PUBNUB.$('vote-'    + vote.film)
    ,   button          = PUBNUB.$('button-'  + vote.film)
    ,   filmbox         = PUBNUB.$('filmbox-' + vote.film);

    // Disable Voting Visually
    if (vote.uuid == my_uuid) disable_voting_box( button, filmbox );

    // Dedupe Voting
    if (film_dedupe_key in vote_dedupe) return;
    vote_dedupe[film_dedupe_key] = 1;

    // Increment Counter
    if (!(vote.film in vote_totals)) vote_totals[vote.film] = 0;
    flim_vote_count.innerHTML = ++vote_totals[vote.film];

    // Flash and Update Display
    animate( flim_vote_count, [
        { 'd' : 0.3, 's' : 2.00, 'r' : 20.0, 'background' : '#fcdb56' },
        { 'd' : 0.8, 's' : 1.00, 'r' : 20.0, 'background' : '#e97d50' }
    ] );
}

// When Connection is Ready and Actively Streaming
function tcp_stream_ready() {

    // Load all History
    get_all_history({
        channel  : vote_channel,
        callback : function(messages) {
            PUBNUB.each( messages, vote_receiver );
        }
    });

}

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
/* LOAD ALL HISTORY EVER.  ;-|
/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
function get_all_history(args) {
    var channel  = args['channel']
    ,   callback = args['callback']
    ,   start    = 0
    ,   count    = 100
    ,   history  = []
    ,   params   = {
            channel  : channel,
            count    : count,
            callback : function(messages) {
                var msgs = messages[0];
                start = messages[1];
                params.start = start;
                PUBNUB.each( msgs.reverse(), function(m) {history.push(m)} );
                callback(history);
                if (msgs.length < count) return;
                count = 100;
                add_messages();
            }
        };

    add_messages();
    function add_messages() { pubnub.history(params) }
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
