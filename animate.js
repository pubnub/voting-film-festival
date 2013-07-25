(function(){
/* =-=====================================================================-= */
/* =-=====================================================================-= */
/* =-==========================     ANIMATE     ==========================-= */
/* =-=====================================================================-= */
/* =-=====================================================================-= */

/*
    animate( PUBNUB.$('m'), [
        { 'd' : 2, 'r' : 360, 'background' : 'orange' },
        { 'd' : 2, 's' : 2, 'r' : 30, 'background' : 'green' }
    ] );
*/

var tranfaobigi = {
    'r'  : 'rotate',
    'rz' : 'rotateZ',
    'rx' : 'rotateX',
    'ry' : 'rotateY',
    'p'  : 'perspective',
    's'  : 'scale',
    'm'  : 'matrix',
    'tx' : 'translateX',
    'ty' : 'translateY'
},  tranfaobigi_unit = {
    'r'  : 'deg',
    'rz' : 'deg',
    'rx' : 'deg',
    'ry' : 'deg',
    'tx' : 'px',
    'ty' : 'px'
}
,   each    = PUBNUB.each
,   attr    = PUBNUB.attr
,   animate = window['animate'] = function( node, keyframes, callback ) {
    var keyframe = keyframes.shift()
    ,   duration = (keyframe && keyframe['d'] || 1) * 1410
    ,   callback = callback || function(){};

    if (keyframe) transform( node, keyframe );
    else return callback();

    // ready for next keyframe
    setTimeout( function(){
        animate( node, keyframes, callback )
    }, duration );
};

function transform( node, keyframe ) {
    var tranbuff  = []
    ,   trans     = ''
    ,   stylebuff = []
    ,   style     = ''
    ,   duration  = (keyframe['d'] || 1) + 's';

    delete keyframe['d'];

    // Transformation CSS3
    each( keyframe, function( k, v ) {
        var what = tranfaobigi[k]
        ,   unit = tranfaobigi_unit[k] || '';

        if (!what) return;
        delete keyframe[k];
        tranbuff.push( what + '(' + v + unit + ')' );
    } );
    trans = tranbuff.join(' ') || '';

    stylebuff.push(
        '-o-transition:all ' +      duration,
        '-moz-transition:all ' +    duration,
        '-webkit-transition:all ' + duration,
        'transition:all ' +         duration,

        '-webkit-transition-timing-function: ease-in-out',
        '-moz-transition-timing-function:    ease-in-out',
        '-ms-transition-timing-function:     ease-in-out',
        '-o-transition-timing-function:      ease-in-out',
        'transition-timing-function:         ease-in-out',

        '-o-transform:' +           trans,
        '-moz-transform:' +         trans,
        '-webkit-transform:' +      trans,
        'transform:' +              trans
    );

    // CSS2
    each( keyframe, function( k, v ) { stylebuff.push( k + ':' + v ) } );
    style = stylebuff.join(';') || '';
    try { attr( node, 'style', style ) } catch(e) {}
}

})();
