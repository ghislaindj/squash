var casper = require('casper').create();
var casper_require = patchRequire(require);
var config = casper_require('./credentials');
var _ = require('lodash');
require('utils');

casper.options.verbose = true;
//casper.options.logLevel = 'debug';
casper.options.waitTimeout = 10000;

var results = [];

// Utile en cas de PB
casper.on('remote.message', function(msg) {
    this.echo('Console: ' + msg, 'WARNING');
});

casper.on('timeout', function() {
    casper.capture('tmp/fail-' + new Date() + '.png')
});


// On commence et on se connecte
casper.start('http://fr.wanaplay.com/auth/login', function() {
    this.fill('#login_form', {
        login: config.username,
        passwd: config.password
    }, true);
    this.echo("Logged in", "INFO");
});

// Puis on va sur la bonne page
casper.thenOpen('http://fr.wanaplay.com/plannings/espacesportifpontoise/act/Squash', function() {
    for(var i = 0; i < 15; i++) {
        this.thenEvaluate(function(remoteCount) {
            // on change la dtae
            var date = new Date();
            date.setDate(date.getDate() + remoteCount);

            dateChanged({dateClicked: true, date: date}); // wanaplay specific function
        }, i);

        this.wait(700);

        // et là on va regarder les creneaux disponibles
        this.then(function(i) {
            var timeslots = [];
            // on utilise la fonction getCreneaux pour regarder ça
            timeslots = this.evaluate(getCreneaux);

            var displayDate = this.evaluate(function() {
                return document.querySelector('#planning>div').innerText;
            });

            this.echo('Le ' + displayDate + ' : ' + timeslots.length);

            var displayTimeslots = _.groupBy(timeslots);

            if(timeslots.length > 0) {
                _.each(displayTimeslots, function(t) {
                    this.echo(' - ' + t[0] + ' ('+ t.length + ')');
                }, this);
            }
        })
    }

});

function getCreneaux(){
    var nodes = [];
    [19, 20, 21, 22, 23, 24].each(function(creneau) {
        nodes = nodes.concat(__utils__.findAll('#planning table>tbody>tr>td table>tbody>tr:nth-of-type('+ creneau + ') td.creneauLibre p'));
    });

    return Array.prototype.map.call(nodes, function(e) {
        return e.innerText;
    });
}

casper.run();