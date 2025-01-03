import axios from 'axios';
import jwt from "jsonwebtoken";
import 'dotenv/config';
export var Scope;
(function (Scope) {
    Scope["COMPANIES_LIST"] = "@companies/list";
    Scope["COMPANIES_GET"] = "@companies/get";
    Scope["COMPANIES_SUMMARY_GET"] = "@companies/summary/get";
    Scope["COMPANIES_SECTORS_LIST"] = "@companies/sectors/list";
    Scope["COMPANIES_SECTORS_GET"] = "@companies/sectors/get";
    Scope["COMPANIES_TICKERS_GET"] = "@companies/tickers/get";
    Scope["COMPANIES_CHARACTERISTICS_GET"] = "@companies/characteristics/get";
    Scope["COMPANIES_RAW_REPORTS_GET"] = "@companies/raw-reports/get";
    Scope["COMPANIES_RAW_REPORTS_REPORTING_MODELS_GET"] = "@companies/raw-reports/reporting_models/get";
    Scope["COMPANIES_REPORTS_GET"] = "@companies/reports/get";
    Scope["COMPANIES_RATIOS_GET"] = "@companies/ratios/get";
    Scope["COMPANIES_RATIOS_VALUATION_GET"] = "@companies/ratios/valuation/get";
    Scope["COMPANIES_INSIDER_TRANSACTIONS_GET"] = "@companies/insider-transactions/get";
    Scope["COMPANIES_STOCK_DIVIDENDS_GET"] = "@companies/stock-dividends/get";
    Scope["COMPANIES_CASH_DIVIDENDS_GET"] = "@companies/cash-dividends/get";
    Scope["COMPANIES_BANK_DATA_GET"] = "@companies/bank-data/get";
    Scope["STOCKS_QUOTE_GET"] = "@stocks/quote/get";
    Scope["STOCKS_QUOTES_GET"] = "@stocks/quotes/get";
    Scope["MACROECONOMICS_INDICATORS_LIST"] = "@macroeconomics/indicators/list";
    Scope["MACROECONOMICS_INDICATORS_GET"] = "@macroeconomics/indicators/get";
    Scope["COMPANIES_SHARES_HISTORY_GET"] = "@companies/shares-history/get";
    Scope["USERS_CREATE"] = "@users/create";
    Scope["USERS_NOTIFY"] = "@users/notify";
})(Scope || (Scope = {}));
export const USER_ROLE_SCOPES = {
    "user": [],
    "insider": [
        Scope.COMPANIES_LIST,
        Scope.COMPANIES_GET,
        Scope.COMPANIES_SUMMARY_GET,
        Scope.COMPANIES_SECTORS_LIST,
        Scope.COMPANIES_SECTORS_GET,
        Scope.COMPANIES_TICKERS_GET,
        Scope.COMPANIES_CHARACTERISTICS_GET,
        Scope.COMPANIES_RAW_REPORTS_GET,
        Scope.COMPANIES_RAW_REPORTS_REPORTING_MODELS_GET,
        Scope.COMPANIES_REPORTS_GET,
        Scope.COMPANIES_RATIOS_GET,
        Scope.COMPANIES_RATIOS_VALUATION_GET,
        Scope.COMPANIES_INSIDER_TRANSACTIONS_GET,
        Scope.COMPANIES_STOCK_DIVIDENDS_GET,
        Scope.COMPANIES_CASH_DIVIDENDS_GET,
        Scope.COMPANIES_BANK_DATA_GET,
        Scope.STOCKS_QUOTE_GET,
        Scope.STOCKS_QUOTES_GET,
        Scope.MACROECONOMICS_INDICATORS_LIST,
        Scope.MACROECONOMICS_INDICATORS_GET,
        Scope.COMPANIES_SHARES_HISTORY_GET,
    ],
    "editor": Object.values(Scope),
    "admin": Object.values(Scope)
};
const AUTHENTICATOR_API_URL = process.env.AUTHENTICATOR_API_URL;
const authenticateWithApiKey = async (req, res, next, apiKey, allowUnauthenticated) => {
    await axios
        .post(AUTHENTICATOR_API_URL, {
        api_key: apiKey,
        url: req.protocol + "://" + req.get("host") + req.originalUrl,
        origin: req.headers["cf-connecting-ip"]
    })
        .then((response) => {
        if (response.data && response.data.scopes) {
            res.locals.scopes = response.data.scopes;
            if (response.headers["request-id"])
                res.set("Request-Id", response.headers["request-id"]);
            return next();
        }
        else {
            if (allowUnauthenticated)
                return next();
            return unavailable(res, "We weren't able to get details about your API key.");
        }
    })
        .catch((error) => {
        if (error.response && error.response.data) {
            if (allowUnauthenticated)
                return next();
            return res.json(error.response.data);
        }
        else {
            if (allowUnauthenticated)
                return next();
            return unavailable(res, "We weren't able to authenticate your request.");
        }
    });
};
const authenticateWithFirebase = async (req, res, next, bearerToken, allowUnauthenticated) => {
    await axios
        .post(AUTHENTICATOR_API_URL, {
        bearer_token: bearerToken,
        url: req.protocol + "://" + req.get("host") + req.originalUrl,
        origin: req.headers["cf-connecting-ip"]
    })
        .then((response) => {
        if (response.data && response.data.scopes) {
            res.locals.scopes = response.data.scopes;
            res.locals.user = response.data.user;
            res.locals.firebase_data = response.data.firebase_data;
            if (response.headers["request-id"])
                res.set("Request-Id", response.headers["request-id"]);
            return next();
        }
        else {
            if (allowUnauthenticated)
                return next();
            return unavailable(res, "We weren't able to get details about you.");
        }
    })
        .catch((error) => {
        if (error.response && error.response.data) {
            if (allowUnauthenticated)
                return next();
            return res.json(error.response.data);
        }
        else {
            if (allowUnauthenticated)
                return next();
            return unavailable(res, "We weren't able to authenticate your request.");
        }
    });
};
const generateApiKey = async (jwtData) => {
    return jwt.sign(jwtData, process.env.API_KEY_SECRET, { expiresIn: '1h' });
};
const unavailable = (res, reason) => {
    res.status(503);
    res.json({
        error: {
            code: 503,
            message: `Service unavailable, please try again soon.${reason !== undefined && reason !== null ? ` ${reason}` : ''}`,
        },
    });
};
const unauthorized = (res, message) => {
    res.status(401);
    res.json({
        error: {
            code: 401,
            message: message || 'Unauthorized.',
        },
    });
};
const forbidden = (res, message, missing_scope) => {
    res.status(403);
    res.json({
        error: {
            code: 403,
            message: message || 'Forbidden.',
            missing_scope,
        },
    });
};
const authenticator = async (req, res, next, allowUnauthenticated) => {
    res.locals.scopes = [];
    let { authorization } = req.headers;
    if (authorization !== undefined &&
        typeof authorization === 'string' &&
        authorization.startsWith('Bearer ') &&
        authorization.split('Bearer ').length === 2) {
        const bearerToken = authorization.split('Bearer ')[1];
        const jwtData = jwt.decode(bearerToken) ?? {
            iss: ""
        };
        let issuer = jwtData["iss"];
        if (issuer !== undefined && issuer === "PARTNR LTDA") {
            return await authenticateWithApiKey(req, res, next, bearerToken, allowUnauthenticated);
        }
        if (issuer !== undefined && issuer === "https://securetoken.google.com/partnr-technologies-production") {
            return await authenticateWithFirebase(req, res, next, bearerToken, allowUnauthenticated);
        }
    }
    if (allowUnauthenticated)
        return next();
    unauthorized(res);
};
const auth = (allowUnauthenticated = false) => {
    return (req, res, next) => {
        return authenticator(req, res, next, allowUnauthenticated);
    };
};
function ensureScope(scope) {
    return (req, res, next) => {
        const userScopes = res.locals.scopes;
        if (userScopes && userScopes.includes(scope)) {
            return next();
        }
        return forbidden(res, 'Your API key is not valid for this request.', scope);
    };
}
function ensureRole(allowedRoles) {
    return (req, res, next) => {
        const user = res.locals.user;
        if (user && allowedRoles.some(aR => aR === user.role)) {
            return next();
        }
        return forbidden(res, 'You do not have permission to access this resource.');
    };
}
export { ensureScope, ensureRole };
export default auth;
//# sourceMappingURL=index.js.map