var casper = require('casper').create();
var casper_require = patchRequire(require);
var config = casper_require('./credentials');

casper.options.verbose = true;
//casper.options.logLevel = 'debug';
casper.options.waitTimeout = 10000;

casper.echo("Casper CLI passed options:");

var creneauFromHour = {
    "21h00" : "21",
    "21h"   : "21",
    "21h40" : "22",
    "22h20" : "23",
    "23h00" : "24",
    "23h"   : "24"
}

var creneau = casper.cli.options["heure"] ? creneauFromHour[casper.cli.options["heure"]] : "22";

casper.on('remote.message', function(msg) {
    //this.echo('Console: ' + msg, 'WARNING');
});

casper.on('timeout', function() {
    casper.capture('tmp/fail-' + new Date() + '.png');
});

casper.start('http://fr.wanaplay.com/auth/login', function() {
    this.fill('#login_form', {
        login: config.username,
        passwd: config.password
    }, true);
    this.echo("Logged in", "INFO");
});

casper.thenOpen('http://fr.wanaplay.com/plannings/espacesportifpontoise/act/Squash', function() {
    this.evaluate(function() {
        var date = new Date();
        date.setDate(14 + date.getDate());
        dateChanged({dateClicked: true, date: date})
    });
    casper.capture('tmp/show-' + new Date() + '.png');

    this.echo("Changed date", "INFO");
});

casper.wait(1000);

casper.waitForSelector('#planning table>tbody>tr>td table>tbody>tr:nth-of-type(' + creneau + ') td.creneauLibre', function() {
    this.evaluate(function() {
        // automatically find a free court
        document.querySelector('#planning table>tbody>tr>td table>tbody>tr:nth-of-type(' + creneau + ') td.creneauLibre').onclick();
    });
    casper.capture('tmp/select-' + new Date() + '.png');
    this.echo("Selected a free court", "INFO");
});

casper.waitForUrl(/takeReservationShow/, function() {
    this.evaluate(function() {
        document.querySelector('#users_0').value = document.querySelector('#users_0 option').value;
        document.querySelector('button[name="commit"]').click();
    });
    casper.capture('tmp/resa-' + new Date() + '.png');
    this.echo("Submitted reservation", "INFO");
});

casper.waitForUrl(/takeReservationConfirm/, function() {
    this.evaluate(function() {
        document.querySelector('button[name="commit"]').click();
    });
    this.echo("Confirmed reservation", "INFO");
});

casper.waitForUrl(/espacesportifpontoise/, function() {
    casper.capture('tmp/result.png');
});

casper.run();