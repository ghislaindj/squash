var casper = require('casper').create();
var casper_require = patchRequire(require);
var config = casper_require('./credentials');
var _ = require('lodash');
require('utils');

casper.options.verbose = true;
//casper.options.logLevel = 'debug';
casper.options.waitTimeout = 10000;


var creneauFromHour = {
    "19h40" : "19",
    "20h20" : "20",
    "21h"   : "21",
    "21h40" : "22",
    "22h20" : "23",
    "23h00" : "24",
    "23h"   : "24"
}

var heure = casper.cli.options["heure"] || "21h40";
var creneau = creneauFromHour[heure];

//casper.echo("Casper lancé pour le creneau : " + heure, "INFO");

var results = [];


casper.on('remote.message', function(msg) {
    //this.echo('Console: ' + msg, 'WARNING');
});

casper.on('timeout', function() {
    casper.capture('tmp/fail-' + new Date() + '.png')
});

casper.start('http://fr.wanaplay.com/auth/login', function() {
    this.fill('#login_form', {
        login: config.username,
        passwd: config.password
    }, true);
    this.echo("Logged in", "INFO");
});


casper.thenOpen('http://fr.wanaplay.com/plannings/espacesportifpontoise/act/Squash', function() {
    for(var i = 0; i < 15; i++) {
        this.thenEvaluate(function(remoteCount) {
            var date = new Date();
            date.setDate(date.getDate() + remoteCount);

            dateChanged({dateClicked: true, date: date}); // wanaplay specific function
        }, i);

        this.wait(700);

        this.then(function(i) {
            var timeslots = [];

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