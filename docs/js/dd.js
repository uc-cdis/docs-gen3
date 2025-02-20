(function (h, o, u, n, d) {
    h = h[d] = h[d] || { q: [], onReady: function (c) { h.q.push(c) } }
    d = o.createElement(u); d.async = 1; d.src = n
    n = o.getElementsByTagName(u)[0]; n.parentNode.insertBefore(d, n)
})(window, document, 'script', 'https://www.datadoghq-browser-agent.com/datadog-rum-v6.js', 'DD_RUM')
window.DD_RUM.onReady(function () {
    window.DD_RUM.init({
        clientToken: 'pub3615430311ce53a67f9d2947719487be',
        applicationId: '865e423a-f62b-460b-befa-25bfc915452f',
        // `site` refers to the Datadog site parameter of your organization
        // see https://docs.datadoghq.com/getting_started/site/
        site: 'ddog-gov.com',
        service: 'docs.gen3.org',
        env: 'docs',
        // Specify a version number to identify the deployed version of your application in Datadog
        // version: '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 0,
        defaultPrivacyLevel: 'mask-user-input',
    });
})
