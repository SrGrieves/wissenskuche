#!/bin/bash

hyper rm -f wk1
hyper run -d \
  --name wk1 \
  -p 8080:8080 \
  -e WK_SELF_URL="http://wk.markcarrier.info:8080" \
  -e WK_GAEA_URL="http://g.carrier.engineering" \
  wk
hyper fip attach wkmcinfo wk1
