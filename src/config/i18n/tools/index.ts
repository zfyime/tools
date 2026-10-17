import jsonFormatter from './json_formatter';
import regexTester from './regex_tester';
import timestampConverter from './timestamp_converter';
import encodingConverter from './encoding_converter';
import codeFormatter from './code_formatter';
import colorTools from './color_tools';
import cryptoTools from './crypto_tools';
import cssGradientGenerator from './css_gradient_generator';
import dateCalculator from './date_calculator';
import htmlMarkdownConverter from './html_markdown_converter';
import httpTester from './http_tester';
import imageCompressor from './image_compressor';
import ipLookup from './ip_lookup';
import jsonConverter from './json_converter';
import jsonEditor from './json_editor';
import jwtDecoder from './jwt_decoder';
import qrcodeGenerator from './qrcode_generator';
import textCounter from './text_counter';
import textSpaceStripper from './text_space_stripper';
import timezoneConverter from './timezone_converter';
import unicodeConverter from './unicode_converter';
import urlEncoder from './url_encoder';
import numberBaseConverter from './number_base_converter';
import ymlPropertiesConverter from './yml_properties_converter';
import base64ToImage from './base64_to_image';
import imageWatermark from './image_watermark';
import imageToIco from './image_to_ico';
import cronGenerator from './cron_generator';
import { iconDesigner } from './icon_designer';
import { pdfConverterI18n } from './pdf_converter';
import { passwordGenerator } from './password_generator';
import aiApiChecker from './ai_api_checker';

import { pdfManager } from './pdf_manager';
import { pdfCompressor } from './pdf_compressor';
export const tools = {
  json_formatter: jsonFormatter,
  regex_tester: regexTester,
  timestamp_converter: timestampConverter,
  encoding_converter: encodingConverter,
  code_formatter: codeFormatter,
  color_tools: colorTools,
  crypto_tools: cryptoTools,
  css_gradient_generator: cssGradientGenerator,
  date_calculator: dateCalculator,
  html_markdown_converter: htmlMarkdownConverter,
  http_tester: httpTester,
  image_compressor: imageCompressor,
  ip_lookup: ipLookup,
  json_converter: jsonConverter,
  json_editor: jsonEditor,
  jwt_decoder: jwtDecoder,
  qrcode_generator: qrcodeGenerator,
  text_counter: textCounter,
  text_space_stripper: textSpaceStripper,
  timezone_converter: timezoneConverter,
  unicode_converter: unicodeConverter,
  url_encoder: urlEncoder,
  number_base_converter: numberBaseConverter,
  yml_properties_converter: ymlPropertiesConverter,
  base64_to_image: base64ToImage,
  image_watermark: imageWatermark,
  image_to_ico: imageToIco,
  cron_generator: cronGenerator,
  icon_designer: iconDesigner,
  password_generator: passwordGenerator,
  ai_api_checker: aiApiChecker,

  pdf_converter: pdfConverterI18n,

  pdf_manager: pdfManager,
  pdf_compressor: pdfCompressor,

};

export default tools; 
