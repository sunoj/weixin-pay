
var util = require('./util');
var request = require('request');
var md5 = require('MD5');

exports = module.exports = WXPay;

function WXPay() {
	
	if (!(this instanceof WXPay)) {
		return new WXPay(arguments[0]);
	};

	this.options = arguments[0];
	if (this.options.sub_mch_id) {
		this.wxpayID = {
			appid: this.options.appid,
			mch_id: this.options.mch_id,
			sub_mch_id: this.options.sub_mch_id
		};
	} else {
		this.wxpayID = {
			appid: this.options.appid,
			mch_id: this.options.mch_id
		};
	}
};

WXPay.mix = function(){
	
	switch (arguments.length) {
		case 1:
			var obj = arguments[0];
			for (var key in obj) {
				if (WXPay.prototype.hasOwnProperty(key)) {
					throw new Error('Prototype method exist. method: '+ key);
				}
				WXPay.prototype[key] = obj[key];
			}
			break;
		case 2:
			var key = arguments[0].toString(), fn = arguments[1];
			if (WXPay.prototype.hasOwnProperty(key)) {
				throw new Error('Prototype method exist. method: '+ key);
			}
			WXPay.prototype[key] = fn;
			break;
	}
};


WXPay.mix('option', function(option){
	for( var k in option ) {
		this.options[k] = option[k];
	}
});


WXPay.mix('sign', function(param){

	var querystring = Object.keys(param).filter(function(key){
		return param[key] !== undefined && param[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key)<0;
	}).sort().map(function(key){
		return key + '=' + param[key];
	}).join("&") + "&key=" + this.options.partner_key;

	return md5(querystring).toUpperCase();
});


WXPay.mix('createUnifiedOrder', function(opts, fn){

	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	util.mix(opts, this.wxpayID);
	opts.sign = this.sign(opts);

	request({
		url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});


WXPay.mix('micropay', function(opts, fn){

	if (!opts.auth_code) {
		fn(null, { return_code: 'FAIL', return_msg: 'missing_auth_code' });
	}
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	util.mix(opts, this.wxpayID);
	opts.sign = this.sign(opts);

	request({
		url: "https://api.mch.weixin.qq.com/pay/micropay",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});


WXPay.mix('sendRedpack', function(opts, fn){
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	opts.sign = this.sign(opts);

	request({
		url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});

WXPay.mix('transfer', function(opts, fn){
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	opts.sign = this.sign(opts);

	request({
		url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});

// 企业付款到银行卡
// {
// 	partner_trade_no: order.partner_trade_no,
// 	enc_bank_no: bank_no,
// 	enc_true_name: name,
// 	bank_code: order.bank_code,
// 	amount: parseInt(order.amount * 100)
// }

WXPay.mix('payBank', function (opts, fn) {
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	opts.enc_bank_no = util.resencrypt(this.options, opts.enc_bank_no);
	opts.enc_true_name = util.resencrypt(this.options, opts.enc_true_name);
	opts.sign = this.sign(opts);
	request({
		url: "https://api.mch.weixin.qq.com/mmpaysptrans/pay_bank",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function (err, response, body) {
		util.parseXML(body, fn);
	});
});

// 企业付款到银行卡查询
// {
// 	 partner_trade_no: order.partner_trade_no
// }
WXPay.mix('payBankQuery', function (opts, fn) {
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	opts.sign = this.sign(opts);

	request({
		url: "https://api.mch.weixin.qq.com/mmpaysptrans/query_bank",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function (err, response, body) {
		util.parseXML(body, fn);
	});
});

WXPay.mix('payBankGetPublickey', function (opts, fn) {
	opts.nonce_str = opts.nonce_str || util.generateNonceString();
	opts.sign = this.sign(opts);

	request({
		url: "https://fraud.mch.weixin.qq.com/risk/getpublickey",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function (err, response, body) {
		util.parseXML(body, fn);
	});
});


WXPay.mix('getBrandWCPayRequestParams', function(order, fn){

	order.trade_type = "JSAPI";
	var _this = this;
	this.createUnifiedOrder(order, function(err, data){
		var reqparam = {
			appId: _this.options.appid,
			timeStamp: Math.floor(Date.now()/1000)+"",
			nonceStr: data.nonce_str,
			package: "prepay_id="+data.prepay_id,
			signType: "MD5"
		};
		reqparam.paySign = _this.sign(reqparam);
		fn(err, reqparam);
	});
});

WXPay.mix('createMerchantPrepayUrl', function(param){

	param.time_stamp = param.time_stamp || Math.floor(Date.now()/1000);
	param.nonce_str = param.nonce_str || util.generateNonceString();
	util.mix(param, this.wxpayID);
	param.sign = this.sign(param);

	var query = Object.keys(param).filter(function(key){
		return ['sign', 'mch_id', 'product_id', 'appid', 'time_stamp', 'nonce_str'].indexOf(key)>=0;
	}).map(function(key){
		return key + "=" + encodeURIComponent(param[key]);
	}).join('&');

	return "weixin://wxpay/bizpayurl?" + query;
});


WXPay.mix('useWXCallback', function(fn){

	return function(req, res, next){
		var _this = this;
		res.success = function(){ res.end(util.buildXML({ xml:{ return_code:'SUCCESS' } })); };
		res.fail = function(){ res.end(util.buildXML({ xml:{ return_code:'FAIL' } })); };

		util.pipe(req, function(err, data){
			var xml = data.toString('utf8');
			util.parseXML(xml, function(err, msg){
				req.wxmessage = msg;
				fn.apply(_this, [msg, req, res, next]);
			});
		});
	};
});
 

WXPay.mix('queryOrder', function(query, fn){
	
	if (!(query.transaction_id || query.out_trade_no)) {
		fn(null, { return_code: 'FAIL', return_msg: 'missing_fields' });
	}

	query.nonce_str = query.nonce_str || util.generateNonceString();
	util.mix(query, this.wxpayID);
	query.sign = this.sign(query);

	request({
		url: "https://api.mch.weixin.qq.com/pay/orderquery",
		method: "POST",
		body: util.buildXML({xml: query})
	}, function(err, res, body){
		util.parseXML(body, fn);
	});
});


WXPay.mix('closeOrder', function(order, fn){

	if (!order.out_trade_no) {
		fn(null, { return_code: "FAIL", return_msg: "missing_out_trade_no" });
	}

	order.nonce_str = order.nonce_str || util.generateNonceString();
	util.mix(order, this.wxpayID);
	order.sign = this.sign(order);

	request({
		url: "https://api.mch.weixin.qq.com/pay/closeorder",
		method: "POST",
		body: util.buildXML({xml:order})
	}, function(err, res, body){
		util.parseXML(body, fn);
	});
});


WXPay.mix('reverse',function(order, fn){
	if (!(order.transaction_id || order.out_trade_no)) {
		fn(null, { return_code: 'FAIL', return_msg: 'missing_fields' });
	}

	order.nonce_str = order.nonce_str || util.generateNonceString();
	util.mix(order, this.wxpayID);
	order.sign = this.sign(order);

	request({
		url: "https://api.mch.weixin.qq.com/secapi/pay/reverse",
		method: "POST",
		body: util.buildXML({xml: order}),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});


WXPay.mix('refund',function(order, fn){
	if (!(order.transaction_id || order.out_trade_no) || !order.out_refund_no) {
		fn(null, { return_code: 'FAIL', return_msg: 'missing_fields' });
	}

	order.nonce_str = order.nonce_str || util.generateNonceString();
	util.mix(order, this.wxpayID);
	order.sign = this.sign(order);

	request({
		url: "https://api.mch.weixin.qq.com/secapi/pay/refund",
		method: "POST",
		body: util.buildXML({xml: order}),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	});
});

