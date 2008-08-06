var base64 = {
  decode: function( what ) {
	var base64_decodetable = new Array (
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,  62, 255, 255, 255,  63,
		 52,  53,  54,  55,  56,  57,  58,  59,  60,  61, 255, 255, 255, 255, 255, 255,
		255,   0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,
		 15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25, 255, 255, 255, 255, 255,
		255,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,
		 41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51, 255, 255, 255, 255, 255
	);
	var result = "";
	var len = what.length;
	var x, y;
	var ptr = 0;

	while( !isNaN( x = what.charCodeAt( ptr++ ) ) )
	{
		if( x == 13 || x == 10 )
			continue;

		if( ( x > 127 ) || (( x = base64_decodetable[x] ) == 255) )
			return false;
		if( ( isNaN( y = what.charCodeAt( ptr++ ) ) ) || (( y = base64_decodetable[y] ) == 255) )
			return false;

		result += String.fromCharCode( (x << 2) | (y >> 4) );

		if( (x = what.charCodeAt( ptr++ )) == 61 )
		{
			if( (what.charCodeAt( ptr++ ) != 61) || (!isNaN(what.charCodeAt( ptr ) ) ) )
				return false;
		}
		else
		{
			if( ( x > 127 ) || (( x = base64_decodetable[x] ) == 255) )
				return false;
			result += String.fromCharCode( (y << 4) | (x >> 2) );
			if( (y = what.charCodeAt( ptr++ )) == 61 )
			{
				if( !isNaN(what.charCodeAt( ptr ) ) )
					return false;
			}
			else
			{
				if( (y > 127) || ((y = base64_decodetable[y]) == 255) )
					return false;
				result += String.fromCharCode( (x << 6) | y );
			}
		}
	}
	return result;
  },

  encode: function (what) {
	var base64_encodetable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var result = "";
	var len = what.length;
	var x, y;
	var ptr = 0;

	while( len-- > 0 )
	{
		x = what.charCodeAt( ptr++ );
		result += base64_encodetable.charAt( ( x >> 2 ) & 63 );

		if( len-- <= 0 )
		{
			result += base64_encodetable.charAt( ( x << 4 ) & 63 );
			result += "==";
			break;
		}

		y = what.charCodeAt( ptr++ );
		result += base64_encodetable.charAt( ( ( x << 4 ) | ( ( y >> 4 ) & 15 ) ) & 63 );

		if ( len-- <= 0 )
		{
			result += base64_encodetable.charAt( ( y << 2 ) & 63 );
			result += "=";
			break;
		}

		x = what.charCodeAt( ptr++ );
		result += base64_encodetable.charAt( ( ( y << 2 ) | ( ( x >> 6 ) & 3 ) ) & 63 );
		result += base64_encodetable.charAt( x & 63 );

	}

	return result;
  }
};
