'use strict';

/* eslint-disable
 no-unused-vars
 */

/* global
 document,
 */

/*
 * This is demo code performing several administrative SDK operations.
 */
var its = require('itslanguage');
var sdk = null;

// Attach handlers
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('applyAdminCredentials').onclick = function() {
    var config = {};
    config.apiUrl = document.getElementById('apiUrl').value;
    config.authPrincipal = document.getElementsByName(
      'adminPrincipal')[0].value;
    config.authCredentials = document.getElementsByName(
      'adminCredentials')[0].value;
    // Setup the SDK.
    sdk = new its.Sdk(config);
  };

  document.getElementById('applyCredentialsTenant').onclick = function() {
    var config = {};
    config.apiUrl = document.getElementById('apiUrl').value;
    config.authPrincipal = document.getElementsByName('principal')[0].value;
    config.authCredentials = document.getElementsByName(
      'credentials')[0].value;
    // Setup the SDK.
    sdk = new its.Sdk(config);
  };

  document.getElementById('createTenant').onclick = function() {
    var name = document.getElementsByName('tenant')[0].value;
    var id = document.getElementsByName('tenantId')[0].value || null;
    var tenant = new its.Tenant(id, name);
    sdk.createTenant(tenant, function(tenant) {
      document.getElementsByName('tenantId')[0].value = tenant.id;
    });
  };

  document.getElementById('createCredentialsTenant').onclick = function() {
    var principal = document.getElementsByName('principal')[0].value || null;
    var credentials = document.getElementsByName('credentials')[0].value ||
      null;
    var tenantId = document.getElementsByName('tenantId')[0].value;
    var basicAuth = new its.BasicAuth(tenantId, principal, credentials);
    sdk.createBasicAuth(basicAuth, function(basicAuth) {
      document.getElementsByName('principal')[0].value = basicAuth.principal;
      document.getElementsByName('credentials')[0].value =
        basicAuth.credentials;
    });
  };

  document.getElementById('createOrganisation').onclick = function() {
    var name = document.getElementsByName('organisation')[0].value;
    var id = document.getElementsByName('organisationId')[0].value || null;
    var organisation = new its.Organisation(id, name);
    sdk.createOrganisation(organisation)
      .then(function(organisation) {
        document.getElementsByName('organisationId')[0].value =
          organisation.id;
      });
  };

  document.getElementById('createStudent').onclick = function() {
    var organisationId = document.getElementsByName(
      'organisationId')[0].value;
    var firstName = document.getElementsByName('student')[0].value || null;
    var studentId = document.getElementsByName('studentId')[0].value || null;
    var student = new its.Student(organisationId, studentId, firstName);
    sdk.createStudent(student, function(student) {
      document.getElementsByName('studentId')[0].value = student.id;
    });
  };
});

