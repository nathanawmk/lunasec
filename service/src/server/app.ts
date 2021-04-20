import crypto from 'crypto';
import express from 'express';
import helmet from 'helmet';

const app = express();

app.set('view engine', 'pug');

app.use(helmet());
app.use((req, res, next) => {
    res.locals.csp_nonce = crypto.randomBytes(16).toString('hex');
    helmet.contentSecurityPolicy({
        directives: {
            scriptSrc: ["'none'", "'unsafe-inline'", `'nonce-${res.locals.csp_nonce}'`],
            objectSrc: "'none'",
            defaultSrc: "'none'",
            frameAncestors: 'http://localhost:3000/',
//      childSrc: 'http://localhost:5002',
            baseUri: "'none'",
            requireTrustedTypesFor: "'script'",
            reportUri: 'http://localhost:5004',
            styleSrc: ["'none'", "'unsafe-inline'", `'nonce-${res.locals.csp_nonce}'`]
        }
    })(req, res, next);
});

app.use('/frame/public', express.static('public'));

const numberRegex = /^\d+\.?\d+?(px|em|rem)$/;

app.get('/frame', (req, res) => {
    const referer = req.headers.referer;
    const nonce = req.query.n;
    const width = req.query.w;
    const height = req.query.h;

    // TODO: Return errors as HTML?
    if (!referer) {
        res.status(400).json({
            error: true,
            message: 'Missing origin for request'
        });
        return;
    }

    if (!nonce) {
        res.status(400).json({
            error: true,
            message: 'Missing unique id for request'
        });
        return;
    }

    if (width === undefined || typeof width !== 'string' || !numberRegex.test(width)) {
        res.status(400).json({
            error: true,
            message: 'Invalid frame width for request'
        });
        return;
    }

    if (height === undefined || typeof height !== 'string' || !numberRegex.test(height)) {
        res.status(400).json({
            error: true,
            message: 'Invalid frame height for request'
        });
        return;
    }

    res.locals.request_origin = referer;
    res.locals.request_nonce = nonce;
    res.locals.input_width = width;
    res.locals.input_height = height;
    res.locals.input_style = `width: ${width}px; height: ${height}px`;
    // TODO: Detokenize token
    res.locals.input_value = req.query.t !== undefined ? req.query.t : '';

    res.render('index');
});

export default app;
