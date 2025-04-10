<template>
<div class="container">
  <div id="score">
    <div><img src="/images/logo.png" alt="TRC-DLマガジン"></div>
    <ul>
      <li><span class="score-th">全タイトル</span><span class="score-num">{{magazineScore}}</span>誌
        <span>(うち新規：{{ newMagazineScore }}誌 </span>)、
        バックナンバー含み<span class="score-num">{{ contentsScore.toLocaleString() }}</span>点を配信
        <button id="new-btn"
          v-on:click="isNewFilterling()"
          v-on:keypress="isNewFilterling()"
        >
          <span v-show="!isNewList">新規タイトルをみる</span>
          <span v-show="isNewList">全タイトルをみる</span>
        </button>
      </li>
      <li>
        <span class="score-th">自館サイトに表示</span><span class="score-num">{{checkedMagazineScore}}</span>誌、バックナンバー含み<span class="score-num">{{ checkedContentsScore.toLocaleString() }}</span>点を配信
      </li>
      <li><span class="score-th">自館サイトに非表示</span><span class="score-num">{{magazineScore-checkedMagazineScore}}</span>誌、バックナンバー含み<span class="score-num">{{(contentsScore- checkedContentsScore).toLocaleString() }}</span>点を配信</li>
    </ul>
  </div><!--score end-->
  <div class="dl-wrap">
    <button v-on:click="fileOutput('lib')">管理用リスト（pdf）</button>
    <button v-on:click="fileOutput('web')">公開用リスト（pdf）</button>
    <button v-on:click="fileOutput('csv')">全件データ（csv）</button>
  </div><!--dl-wrap end-->

  <div id="search">
    <label for="keyword" class="head-ttl">キーワード</label>
    <input id="keyword" type="text" v-model="searchkw" placeholder="雑誌名、出版社" v-on:keydown.enter="isFilterling">
    <button id="search-btn" v-on:click="isFilterling">検索</button>
  </div><!--search end-->

  <div id="filter-btn-wrap">
    <button id="filter-toggleBtn"
     v-bind:class="{'active':isActive}"
     v-on:click="genreToggle()"
    >
      ジャンル等で絞り込む
    </button>
  </div><!--filter-btn-wrap end-->
  <div id="filter-selected-wrap" v-bind:class="{'active':isActive}">
    <fieldset id="genre">
      <legend>ジャンル</legend>
      <div>
        <button v-on:click="genreSelectAll('select')">全て選択</button>
        <button v-on:click="genreSelectAll('cancel')">全て解除</button>
      </div>

      <span v-for="(item, index) in genreData" v-bind:key="index">
        <input type="checkbox" v-bind:value="item.genreID" v-bind:id="item.genreID" v-model="selectedGenre" v-on:change="isFilterling">
        <label v-bind:for="item.genreID">{{item.genreName}}（{{item.genreCount}}）</label>
      </span>
    </fieldset>
    <div id="etc-wrap">
      <div id="foreign-books">
        <button id="foreign-books-btn" v-on:click="isForeignBooksFilterling()">洋雑誌のみ表示</button>
      </div><!--foreign-books end-->
    </div><!--etc-wrap end-->
  </div><!--filter-selected-wrap end-->


  <div id="reset-wrap">
    <button id="reset-btn" v-on:click="isReset()">リセット</button>
  </div><!--reset-wrap end-->

  <div id="msg">
    <p v-show="msg">{{ msg }}</p>
  </div><!--msg-->

  <div v-show="!msg" id="display-opr">
    <select name="sort" id="sort" v-model="sortType">
      <option v-for="(item,index) in sortTypeData" v-bind:key="index" v-bind:value="item.val">{{item.txt}}</option>
    </select><!--並び順-->

    <div class="count-display">
      全{{totalCount}}件中{{from}}～{{to}}件
    </div><!--count-display end-->
    <div id="select-count">
      <select v-on:change="onChangeCount" aria-label="件数表示" v-model="countList">
        <option v-for="(list,index) in countListData" v-bind:key="index" v-bind:value="list.val">
          {{list.txt}}
        </option>
      </select>
      <span>件表示</span>
    </div><!--select-count 件数表示 end-->

    <div class="pager">
      <paginate
        :v-model="currentPage"
        :page-count="getPageCount"
        :page-range="3"
        :click-handler="clickCallback"
        :prev-text="''"
        :prev-class="'pre'"
        :next-text="''"
        :next-class="'next'"
        :container-class="'pagination'"
        :page-class="'page-item'"
        ref="paginateHead"
      >
      </paginate>
    </div><!--pager end-->

    <button  id="display-type" v-on:click="onChangeDisplay">
      <span id="tbl-btn" v-if="displayLayout=='list'">簡易表示</span>
      <span id="list-btn" v-else>詳細表示</span>
    </button><!-- 詳細⇔簡易-->
  </div><!--display-opr end-->

  <div v-show="!msg" id="list-body" v-bind:class="displayLayout">
    <div class="list-body-contents" id="list-body-head">
      <div>No</div>
      <div>ジャンル</div>
      <div v-show="displayLayout=='list'">出版社</div>
      <div>雑誌名</div>
      <div>発行間隔</div>
      <!--<div>最新号閲覧</div>-->
      <div>配信時期</div>
      <div>配信期間</div>
      <div v-show="displayLayout=='list'">配信点数</div>
      <div>自館サイト表示</div>
    </div><!--list-body-head end-->
    <div v-for="(item,index) in getLists" v-bind:key="index" class="list-body-contents" v-bind:class="getClass(item.magazineID)">
      <!--no-->
      <div v-bind:class="getClass(item.magazineID)"><span v-show="displayLayout=='list'">No.</span>{{ (index+1)+((currentPage-1)*parPage) }}</div>
      <!--ジャンル-->
      <div v-bind:class="getClass(item.magazineID)" class="item-genre">{{ item.genreName }}</div>

      <!--洋雑誌 リストのみ-->
      <div v-show="displayLayout=='list' && item.foreignBooks=='1'" class="item-genre">洋雑誌</div>
      <!--出版社 リストのみ-->
      <div v-show="displayLayout=='list'" class="item-pub">{{ item.publisher }}</div>
      <!--雑誌名-->
      <div v-bind:class="getClass(item.magazineID)" class="item-title">
        <span v-show="item.new=='1'" class="new">new</span>
        {{ item.title }}
      </div><!--title end-->
      <!--サイクル-->
      <div v-bind:class="getClass(item.magazineID)">
        <span class="item-list"></span>
        <!--<span v-show="displayLayout=='list'">サイクル：</span>-->
        {{ item.streamed }}
      </div>
      <!--
      <div style="background:red">
        <span v-for="i in viewPattern" v-bind:key="i">
          <span v-if="item.vpID === i.vpID"><span class="vptn">{{ i.vpDisplay }}</span><span v-show="displayLayout=='list'">{{ i.vpDesc }}</span></span>
        </span>
      </div>
      -->
      <div v-bind:class="getClass(item.magazineID)"><!--配信時期-->
        <span v-show="displayLayout=='list'" class="item-list">配信時期：</span>
        {{ item.viewStart }}
        <!--
        <span v-for="i in viewPattern" v-bind:key="i">
          <span v-if="item.vpID === i.vpID">
            <span v-show="displayLayout=='list'">配信時期：</span>
            {{ i.deliveryTime }}
          </span>
        </span>
        -->
      </div>
      <div v-bind:class="getClass(item.magazineID)">
        <span v-show="displayLayout=='list'" class="item-list">配信期間：</span>{{ item.deliveryRange }}
      </div>
      <div v-show="displayLayout=='list'">
        <span class="item-list"></span>配信点数：{{ item.deliveryScore }}点（{{ item.browsePossible }}～）
        <span v-show="item.new=='1'">{{item.deliveryStart}}より</span>
      </div>
      <div class="selected-item" v-bind:class="getClass(item.magazineID)">
        <label for="item.magazineID">
          <span v-show="displayLayout=='list'">表示：</span>
          <input id="item.magazineID" type="checkbox" v-bind:value="item.magazineID" v-model="selectedItems">
        </label>
      </div><!--selected-item end-->
      <div v-show="displayLayout=='list'" class="schedule-wrap" v-bind:class="{'has':item.distributionStarts.length}">
        <span class="schedule-head">次号配信予定</span>
        <div class="schedule-detail">
          <span v-for="j in item.distributionStarts" v-bind:key="j">{{ j }}</span>
        </div><!--schedule-detail end-->
      </div><!--schedule end-->
    </div>
  </div><!--list-body end-->
  <div v-show="!msg" id="list-foot">
    <div class="count-pager">
      <div class="count-display">
        全{{totalCount}}件中{{from}}～{{to}}件
      </div><!--count-display end-->
      <div class="pager">
        <paginate
          :v-model="currentPage"
          :page-count="getPageCount"
          :page-range="3"
          :click-handler="clickCallback"
          :prev-text="''"
          :prev-class="'pre'"
          :next-text="''"
          :next-class="'next'"
          :container-class="'pagination'"
          :page-class="'page-item'"
          ref="paginateFoot"
          >
        </paginate>
      </div><!--pager end-->
    </div><!--count-pager end-->
    <div class="dl-wrap">
      <div>
        <button v-on:click="fileOutput('lib')">管理用リスト（pdf）</button>
        <button v-on:click="fileOutput('web')">web表示用リスト（pdf）</button>
      </div>
      <div>
        <button v-on:click="fileOutput('all')">簡易リスト（pdf）</button>
        <!--<a href="./pdf/trcdl_magazine_titlelist.pdf" download>全件リスト（pdf）</a>-->
        <button v-on:click="fileOutput('csv')">全件データ（csv）</button>
      </div>
    </div><!--dl-wrap end-->
  </div><!--list-foot end-->
</div><!--container end-->
</template>

<script>
import _ from "lodash";
import axios from 'axios';
import Paginate from 'vuejs-paginate-next';
import pdfMake from "pdfmake";
import * as pdfFonts from  'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
export default {
  name: 'dlMagazine',
  components:{
    paginate: Paginate,
  },
  data() {
    return {
      msg:'',
      displayLayout:'',
      isActive: false,//ジャンル表示
      isNewList:false,//新規のみ

      //json格納先
      all:[],
      deliveryRange:[],
      genre:[],
      viewPattern:[],
      childAll:[],
      config:{},

      configDate:"",//設定日

      filteringList: [],//絞り込み結果

      searchkw:"",//検索ボックス

      //出力選択チェックボックス
      selectedItems:[],
      selectedItemsAll:[],//全選択

      //ジャンルチェックボックス
      selectedGenre:[],
      selectedGenreAll:[],//全選択

      //並び替え
      sortType:"titleAsc",
      sortTypeData:[
        {val:"titleAsc",txt:"雑誌名昇順"},
        {val:"titleDesc",txt:"雑誌名降順"}
      ],

      //ページャ
      countList:"100",
      countListData:[
      {val:20,txt:"20"},
      {val:50,txt:"50"},
      {val:100,txt:"100"},
      {val:150,txt:"150"},
      {val:"all",txt:"全"},
      ],
      parPage: 100,//1ページに表示する件数
      currentPage: 1,

      corpFlg:""
    }
  },
  /*
  created:function(){
    //クエリパラメータ取得
    const params = new URLSearchParams(window.location.search);
    this.corpFlg=params.get('corp');
  },
  */
  async mounted() {
    //json読み込み
    await this.fetchData(['all','deliveryRange','viewPattern','childAll','config']);//ジャンルのjsonファイルを使用しない

    this.configDate=this.config.date.replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, '$1年$2月$3日');
    this.corpFlg=this.config.corp
    //await this.fetchData(['all','deliveryRange','genre','viewPattern']);

    //子データの日付でこれから配信されるものを絞り込み

    /*今日の日付取得-------いったんなし
    const today =new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
    //今日の日付以降で絞り込み
    ---------------------*/

    const today = new Date(this.config.date);//設定日
    var child=this.childAll;//配信
    //var filteredChild = child.filter(child => new Date(child.distributionStarts) <= today);//配信開始日が設定日より前

    //次回配信
    //子データをmagazineIDでグループ化し、distributionStartsの配列を作成
    var NextChild=child.reduce((acc, item) => {
      if (new Date(item.distributionStarts) > today) {//配信開始日が設定日より後
        if (!acc[item.magazineID]) {
          acc[item.magazineID] = [];
        }
        acc[item.magazineID].push(item.distributionStarts);
      }
      return acc;
    }, {});

    //配信点数
    var countChild=child.reduce((c,i) => {
      if (new Date(i.distributionStarts) <= today) {
        var key = i.magazineID;
        c[key] = (c[key] || 0) + 1;
      }
      return c;
    }, {});

    //閲覧可能（筆頭）
    //var firstChild=_.orderBy(child, 'distributionStarts', 'asc');
    var firstChild = _.orderBy(child, [(obj) => new Date(obj.distributionStarts)], ['asc'])
    firstChild=firstChild.reduce((f,i) => {
      if (new Date(i.distributionStarts) <= today) {
        var key = i.magazineID;
        if (!f[key]) {
          f[key] = i.coverDate;
        }
      }
      return f;
    },{});

    //magazineIDで紐づけて、tagsを追加する
    var all=this.all;
    //法人不可を除く（クエリパラメータに値がある場合→configのcorpが1の場合）
    if(this.corpFlg=='1'){
      all = _.filter(all, function(item) {
        return item.corp !== "1";
      });
    }
    var data = _.filter(all, mag => mag.magazineID !== 'delete');//deleteを除く
    var newData=data.map(item => {

      var NextchildData = NextChild[item.magazineID] || { distributionStarts: []};
      var CountchildData = countChild[item.magazineID] || '';
      var firstChildData=firstChild[item.magazineID] || '';
      // 検索フィールドを作成
      var tags = `${item.title} ${item.titleYomi} ${item.publisher}`;
      // itemに追加して返す
      return { ...item, distributionStarts: NextchildData,deliveryScore:CountchildData,browsePossible:firstChildData,tags: tags };
    });

    //出力チェック用配列生成（アクセス時は全選択）
    this.selectedItemsAll=newData.map(id => id.magazineID);
    this.selectedItems=this.selectedItemsAll;

    //検索・表示用にデータ
    this.all=newData;
    this.filteringList=newData;

    //ジャンル配列を生成
    this.genre=this.all.reduce(function(result, current) {
      if (!result.some(item => item.genreID === current.genreID && item.genreName === current.genreName)) {
        result.push({genreID: current.genreID, genreName: current.genreName});
      }
      return result;
    }, []);

    //selectedGenreの中身を生成（アクセス時は全選択）
    this.selectedGenreAll=this.genre.map(id => id.genreID);
    this.selectedGenre=this.selectedGenreAll;
  },
  computed: {
    //ジャンル
    genreData:function(){
      const data=this.filteringList;
      const genreCountData=this.genre;
      var crossTab = {};
      //クロス集計
      data.forEach(function(item) {
        if (crossTab[item.genreID]) {
          crossTab[item.genreID]++;
        }else{
          crossTab[item.genreID] = 1;
        }
      });
      // クロス集計を配列に変換
      var result = Object.keys(crossTab).map(function(genreID) {
        return {
          genreID: genreID,
          genreName: data.find(function(item) { return item.genreID === genreID; }).genreName,
          genreCount: crossTab[genreID]
        }
      });
      //ジャンルに件数を追加
      genreCountData.forEach(function(item) {
        var countItem = result.find(function(count) {
          return count.genreID === item.genreID;
        });
        if (countItem) {
          item.genreCount = countItem.genreCount;
        }else{
          item.genreCount = 0;//無い場合は0を追加
        }
      });
      return genreCountData;
    },
    //全データ
    getItems:function(){
      const data=this.filteringList;
      const sort=this.sortType;
      if(sort){
        if(sort=='titleAsc'){
          return _.orderBy(data, 'titleYomi', 'asc'); //昇順
        }else{
          return _.orderBy(data, 'titleYomi', 'desc'); //降順
        }
      }
      return data;
    },
    //雑誌総数
    magazineScore:function(){
      return this.all.length;
    },
    //チェック済雑誌総数
    checkedMagazineScore:function(){
      //const data=this.filteringList;
      const data=this.all;
      const selected=this.selectedItems;
      let orderData=[];

      data.forEach(item =>{
        if(selected.includes(item.magazineID)){
          orderData.push(item);
        }
      });
      return orderData.length;
    },
    //チェック済雑誌総数-新規
    newMagazineScore:function(){
      const data=this.all;
      return _.filter(data, { new: "1" }).length;
    },
    //コンテンツ総数
    contentsScore:function(){
      const data=this.all;
      let totalDeliveryScore = 0;
      for (let i = 0; i < data.length; i++) {
        totalDeliveryScore += Number(data[i].deliveryScore);
      }
      return totalDeliveryScore;
    },
    //チェック済コンテンツ総数
    checkedContentsScore:function(){
      const data=this.all;
      const selected=this.selectedItems;
      let orderData=[];

      data.forEach(item =>{
        if(selected.includes(item.magazineID)){
          orderData.push(item);
        }
      });
      let totalDeliveryScore = 0;
      for (let i = 0; i < orderData.length; i++) {
        totalDeliveryScore += Number(orderData[i].deliveryScore);
      }
      return totalDeliveryScore;
    },
    //新規配信数
    newScore:function(){
      const data=this.all;
      return _.filter(data, { new: "1" }).length;
    },
    //表示データ
    getLists:function(){
      let current = this.currentPage * this.parPage;
      let start = current - this.parPage;
      return this.getItems.slice(start, current);
      },
     //全体のページ数
    getPageCount: function(){
      return Math.ceil(this.getItems.length / this.parPage);
    },
     //総件数
    totalCount:function(){
      return this.filteringList.length;
    },
     //表示件数先頭
    from:function(){
      let current = this.currentPage * this.parPage;
      return (current - this.parPage) + 1;
    },
     //表示件数最後
    to: function () {
      let current = this.currentPage * this.parPage;
      return current - this.parPage + (this.getLists.length);
    },
  },
  methods: {
    //json読み込み
    async fetchData(fileNames) {
      for (const fileName of fileNames) {
        this.msg = 'データを読み込み中です';
        //this.msg = `${fileName} のデータを読み込み中です`;
        try {
          const response = await axios.get(`./jsonfiles/${fileName}.json`);
          this[fileName] = response.data;
          this.msg = "";
        }catch (error) {
          console.log(error);
        }
      }
    },
    //検索
    isFilterling:function(){
      const data=this.all;//全データ
      const setGenre=this.selectedGenre;//選択されたジャンル
      let skw = this.searchkw;//検索ワード
      if(this.searchkw){
        skw = this.searchkw.trim(); //検索ワード,前後の空白を削除
      }else{
        skw='';
      }
      //ひらがな→カタカナ
      function hiraToKana(word) {
        return word.replace(/[\u3041-\u3096]/g, function(match) {
          return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
      }
      // 文字列を全角・半角正規化し、ひらがなをカタカナに変換
      function normalizeToKatakana(word) {
        // 全角と半角の正規化
        word = word.normalize('NFKC');
        // 英字を小文字に正規化
        word = word.toLowerCase();
        // ひらがなをカタカナに変換
        return hiraToKana(word);
      }
      //ジャンル絞り込み
      this.filteringList = _.filter(data, magazine => setGenre.includes(magazine.genreID));

      //検索語チェック
      skw = skw.replace(/</g, ' ');
      skw = skw.replace(/>/g, ' ');
      skw = skw.replace(/'/g, ' ');
      skw = skw.replace(/&/g, ' ');
      skw = skw.replace(/"/g, ' ');
      skw = skw.replace(/\//g, ' ');
      skw = skw.replace('　', ' ');
      //検索語の正規化
      skw = normalizeToKatakana(skw);

      //検索ワードをスペース区切りで配列へ
      let kwsArray = skw.split(" ");
      kwsArray = kwsArray.filter((string) => {
        return string !== "";
      });
      //キーワード検索
      if (skw) {
        this.filteringList = this.filteringList.filter((kw) => {
          const normalizedTags = normalizeToKatakana(kw.tags);
          return _.every(kwsArray, keyword => _.includes(normalizedTags, keyword));
        });
      }
      //ノーヒット
      if(this.filteringList.length===0){
        this.msg="該当のタイトルはありません"
      }else{//ヒット
        this.msg="";
        this.currentPage=1;//ページャーは1へ
        this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;//上下ページャーを同じへ
      }

    },
    //新規のみ表示
    isNewFilterling:function(){
      this.isNewList = !this.isNewList;//新規のみ表示
      const data=this.all;//全データ
      if(this.isNewList){
        this.isReset();
        this.filteringList=_.filter(data, { new: "1" });
      }else{
        this.isReset();
        this.filteringList=data;
      }
    },
    //洋雑誌のみ表示
    isForeignBooksFilterling:function(){
      const data=this.filteringList;
      this.filteringList=_.filter(data, { foreignBooks: "1" });
      //ノーヒット
      if(this.filteringList.length===0){
        this.msg="該当のタイトルはありません"
      }else{//ヒット
        this.msg="";
        this.currentPage=1;//ページャーは1へ
        this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;//上下ページャーを同じへ
      }
    },
    //法人プラン不可絞込★いったん、保留
    corpExclusion:function(){
      const data=this.filteringList;
      this.filteringList = _.filter(data, function(item) {
        return item.corp !== "1";//使用時は値を確認
      });
      //ノーヒット
      if(this.filteringList.length===0){
        this.msg="該当のタイトルはありません"
      }else{//ヒット
        this.msg="";
        this.currentPage=1;//ページャーは1へ
        this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;//上下ページャーを同じへ
      }
    },
    //ジャンル表示・非表示
    genreToggle:function(){
      this.isActive = !this.isActive
    },
    //ジャンル全選択・全解除
    genreSelectAll:function(allType){
      if(allType=='select'){
        this.isReset();
        this.selectedGenre=this.selectedGenreAll;
        this.isFilterling();
      }else if(allType=='cancel'){
        this.isReset();
        this.selectedGenre=[];
        this.isFilterling();
      }else{
        return;
      }
    },
    //件数表示切り替え
    onChangeCount:function(){
      const selectedCount=this.countList;//件数表示list

      this.currentPage=1;//切替時にページャーは1へ
      this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;//上下ページャーを同じへ
      //「全」選択
      if(selectedCount==='all'){
        this.parPage=this.totalCount;
      }else{
        //「全」以外
        this.parPage=selectedCount;
      }
    },
    //グリッド・リスト
    onChangeDisplay:function(){
      const display=this.displayLayout;
      if(display==="list"){
        this.displayLayout='';
      }else{
        this.displayLayout='list';
      }
    },
    //チェックボックス選択class
    getClass(id) {
      return {
        'not-selected': !this.selectedItems.includes(id)
      }
    },
    //リセット
    isReset:function(){
      this.msg="";
      this.displayLayout="";
      this.filteringList=this.all;
      this.searchkw="";
      this.selectedGenre=this.selectedGenreAll;
      this.selectedItems=this.selectedItemsAll;
      this.sortType="titleAsc";

      this.currentPage=1;//ページャーは1へ
      this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;//上下ページャーを同じへ
    },
    //pagination
    clickCallback: function (pageNum){
      this.currentPage = Number(pageNum);
      //上下のページャーを同じへ
      this.$refs.paginateHead.selected = this.$refs.paginateFoot.selected = this.currentPage;
    },
    //pdf出力
    fileOutput:function(type){
      //設定日
      const settingDate=this.configDate;

      //日付取得してファイル名へ
      const now =new Date().toLocaleDateString('sv-SE').replaceAll('-', '');
      const time = new Date().toLocaleTimeString('sv-SE', {hour12:false}).replaceAll(':', '');
      const fileName=String(now)+String(time);

      //出力チェックあり
      const data=this.all;
      const selectedItems=this.selectedItems;
      let orderData=[];
      data.forEach(item =>{
        if(selectedItems.includes(item.magazineID)){
          orderData.push(item);
        }
      });
      //タイトル昇順
      orderData = _.orderBy(orderData, 'titleYomi', 'asc');

      //ジャンルごとにグループ化（簡易リスト）
      const groupedData = orderData.reduce((acc, current) => {
        // genreID と genreName が同じオブジェクトを探す
        const existingGroup = acc.find(group => group.genreID === current.genreID);
        if (existingGroup) {
          // 既存のグループがあれば、items配列に追加
          existingGroup.itemCount += 1;
          existingGroup.items += `● `+`${current.title}`+`（`+`${current.streamed}`+`）`;
          //existingGroup.items.push({title:current.title,streamed:current.streamed});
        }else {
          // 新しいグループを作成
          acc.push({
            genreID: current.genreID,
            genreName: current.genreName,
            itemCount: 1,
            items:`● `+`${current.title}`+`（`+`${current.streamed}`+`）`,
            //items: [{title:current.title,streamed:current.streamed}]
          });
        }
        return acc;
      }, []);
      // genreIDの昇順にソート
      groupedData.sort((a, b) => a.genreID - b.genreID);

      //pdfのtbody内データ
      //共通
      let thBoder=[false, false, false, false];
      let thColor="#ffffff";//ヘッダー文字色
      let tdColorOdd="#333333";//td文字色(odd)
      let tdBgEven="#ffffff";//td背景色(Even)
      let tdColorEven="#333333";//td文字色(Even)
      let newColor='#e9455a';//新規文字列

      //管理用
      let thBg="#386CAA";//ヘッダー背景色
      let tdBgOdd="#D3E6F6";//td背景色(odd)

      //web用
      let thBgWeb="#758C48";//ヘッダー背景色
      let tdBgOddWeb="#E6EBD2";//td背景色(odd)


      //管理用リストtbody
      const renderDataLib=orderData.map((data,index) =>{
        //style
        let borderColor=['#ffffff', '#ffffff', '#ffffff', '#ffffff'];//bordercolor
        let bg;//背景色
        let fontColor;//文字色
        let newText;//new文字列
        let newtitle;//newタイトル太字
        if(index % 2 == 1){
          bg=tdBgOdd;
          fontColor=tdColorOdd;
        }else{
          bg=tdBgEven;
          fontColor=tdColorEven;
        }
        //最新号閲覧
        let vpIDText;
        switch (data.vpID) {
          case '10':
            vpIDText="◎";
            break;
          case '20':
            vpIDText="○";
            break;
          case '30':
            vpIDText="×";
            break;
          default:
            vpIDText="";
        }
        //新規
        if(data.new==1){
          newText='　 '+data.deliveryStart+'より';
        }else{
          newText='';
        }
        //新規太字
        if(data.new==1){
          newtitle='titleNew';
        }else{
          newtitle='title';
        }
        return[
          {text:index+1,style:['no'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.genreName,style:['tdGP'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.publisher,style:['tdGP'],borderColor: borderColor,fillColor:bg,color:fontColor},
          //{text:data.title+newText,style:['title'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {
            text:[
            { text: data.title, style: newtitle },
            { text: newText, color: newColor, style: 'new' }
            ],
            borderColor: borderColor,fillColor:bg,color:fontColor
          },
          {text:data.streamed,style:['tdGen','center'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:vpIDText,style:['vp','center'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.viewStart,style:['tdGen','center'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.deliveryRange,style:['tdGen','center'],borderColor: borderColor,fillColor:bg,color:fontColor}
        ]
      });

      //web表示用tbody
      const renderDataWeb=orderData.map((data,index) =>{
        //style
        let borderColor=['#ffffff', '#ffffff', '#ffffff', '#ffffff'];//bordercolor
        let bg;//背景色
        let fontColor;//文字色
        let newText;//new文字列
        let newtitle;//newタイトル太字
        if(index % 2 == 1){
          bg=tdBgOddWeb;
          fontColor=tdColorOdd;
        }else{
          bg=tdBgEven;
          fontColor=tdColorEven;
        }
        //最新号閲覧
        let vpIDText;
        switch (data.vpID) {
          case '10':
            vpIDText="◎";
            break;
          case '20':
            vpIDText="○";
            break;
          case '30':
            vpIDText="×";
            break;
          default:
            vpIDText="";
        }
        //新規
        if(data.new==1){
          newText='　 '+data.deliveryStart+'より';
        }else{
          newText='';
        }
        //新規太字
        if(data.new==1){
          newtitle='titleNew';
        }else{
          newtitle='title';
        }
        return[
          {text:index+1,style:['no'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.genreName,style:['tdGP'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:data.publisher,style:['tdGP'],borderColor: borderColor,fillColor:bg,color:fontColor},
          //{text:data.title,style:['title'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {
            text:[
            { text: data.title, style: newtitle },
            { text: newText, color: newColor, style: 'new' }
            ],
            borderColor: borderColor,fillColor:bg,color:fontColor
          },
          {text:data.streamed,style:['tdGen','center'],borderColor: borderColor,fillColor:bg,color:fontColor},
          {text:vpIDText,style:['vp','center'],borderColor: borderColor,fillColor:bg,color:fontColor},
        ]
      });

      //1p用
      const renderDataQuick=groupedData.map((data) =>{
        return[
          {
            table:{
              widths:[data.genreName.length*8,30, 520-(data.genreName.length*8)],
              //widths: ['auto','auto', '*'],
              headerRows: 1,
              keepWithHeaderRows: 1,
              dontBreakRows: true,

              body:[
                [
                  {text: data.genreName, style: ['genreName'], fillColor: thBg, borderColor: [thBg, thBg, thBg, thBg] },
                  {text:data.itemCount+'件',style:['genreCount'],fillColor: thBg,borderColor:[thBg,thBg,thBg,thBg]},
                  {text:"雑誌名<50音順>（サイクル）",style:['toc'],fillColor: thBg,borderColor:[thBg,thBg,thBg,thBg]}
                ],
                [
                  {text:data.items,style:['ttl'], colSpan: 3,borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']}
                ]
              ]
            }
          },
        ]
      });
      pdfMake.fonts = {
        NotoSansJP: {normal: "NotoSansJP-Regular.ttf",bold: "NotoSansJP-Bold.ttf"}
      }
      //管理用リスト
      const docDefLib = {
        pageSize: 'A4',
        pageMargins: [ 8,46,8,14 ],
        styles: {
          center:{
            alignment: 'center'
          },
          tdGen:{//サイクル・閲覧開始日・バックナンバー配信期間
            fontSize:7
          },
          tdGP:{//ジャンル・出版社
            fontSize:6
          },
          no:{
            fontSize:7,
            alignment: 'center'
          },
          title:{
            fontSize:8
          },
          titleNew:{
            fontSize:8,
            bold: true
          },
          new:{
            fontSize:6,
            bold: true
          },
          vp:{
            fontSize:9,
            alignment: 'center'
          },
          thDr:{
            fontSize:6,
            alignment: 'center'
          },
        },
        header: function() {
          return [
            {
              margin: [8, 8, 8, 0],
              columns: [
              {
                  image:'data:image/png;base64,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',
                  width:120
                },
                {text:'タイトルリスト（'+settingDate+'現在）',color:thBg},
              ],
            },
            {
              margin: [8, 4, 8, 0],
              columns:[
                {
                  text:'最新号は図書館内のみで閲覧可',
                  alignment: 'left',
                  margin: [5,0,0,0],
                  fontSize:9,
                  color:'#808080',
                },
                {
                  text:'（※）◎最新号発売と同時に配信　〇最新号発売日より遅れて配信　×バックナンバーのみ',
                  margin: [0,5,0,0],
                  fontSize:7
                }
              ]
            }
          ]
        },
        footer: function(currentPage, pageCount) {
           return [
            {
              text:currentPage.toString() + ' / ' + pageCount,
              fontSize:7,
              alignment: 'center'
              /*
              columns:[
                {
                  text:'株式会社 図書館流通センター',
                  fontSize:7,
                  margin:[8,0,0,0]
                },
                {
                  text:currentPage.toString() + ' / ' + pageCount,
                  fontSize:7,
                  alignment: 'right',
                  margin:[0,0,8,0]
                },
              ]
              */
            }
           ]
          },
        content: [
          {
            table:{
              widths: [ 16, 65, 65, "*", 38,40, 73, 50],
              headerRows: 1,
              keepWithHeaderRows: 1,
              dontBreakRows: true,
              body:[
                [
                  {text:'No',style:['no'],fillColor: thBg,color:thColor,border:thBoder},
                  {text:'ジャンル',style:['tdGen'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'出版社',style:['tdGen'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'雑誌名（50音順）',style:['tdGen'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'発行間隔',style:['tdGen','center'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'最新号閲覧\n※',style:['tdGen','center'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'閲覧開始日',style:['tdGen','center'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'バックナンバー配信期間',style:['thDr'],fillColor: thBg,color:thColor,borderColor:thBg,border:thBoder},
                ],
                ...renderDataLib,
              ]
            }
          },
          {
            text:'最新号の閲覧状況は雑誌の発売日変更や出版社都合により、リストと異なる場合がございます。',
            alignment:'center',
            fontSize:9,
            margin:[0,8,0,0],
            color:thBg
          }
        ],
        defaultStyle: {
          font: 'NotoSansJP',
          fontSize:10
        }
      }

      //web表示用リスト
      const docDefWeb = {
        pageSize: 'A4',
        pageMargins: [ 8,46,8,14 ],
        styles: {
          center:{
            alignment: 'center'
          },
          tdGen:{
            fontSize:7
          },
          tdGP:{//ジャンル・出版社
            fontSize:6
          },
          no:{
            fontSize:7,
            alignment: 'center'
          },
          title:{
            fontSize:8
          },
          titleNew:{
            fontSize:8,
            bold: true
          },
          new:{
            fontSize:6,
            bold: true
          },
          vp:{
            fontSize:9,
            alignment: 'center'
          },
          thDr:{
            fontSize:7,
            alignment: 'center'
          },
        },
        header: function() {
          return [
            {
              margin: [8, 8, 8, 0],
              columns: [
              {
                  image:'data:image/png;base64,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',
                  width:120
                },
                {text:'タイトルリスト（'+settingDate+'現在）',color:thBg},
              ],
            },
            {
              margin: [8, 4, 8, 0],
              columns:[
              {
                  text:'最新号は図書館内のみで閲覧可',
                  alignment: 'right',
                  fontSize:9,
                  color:'#808080'
                },
                {
                  text:'（※）◎最新号発売と同時に配信　〇最新号発売日より遅れて配信　×バックナンバーのみ',
                  margin: [0,5,0,0],
                  fontSize:7
                }
              ]
            }
          ]
        },
        footer: function(currentPage, pageCount) {
           return [
            {
              columns:[
                /*
                {
                  text:'株式会社 図書館流通センター',
                  fontSize:7,
                  margin:[8,0,0,0]
                },
                */
                {
                  text:currentPage.toString() + ' / ' + pageCount,
                  fontSize:7,
                  alignment: 'center'
                },
              ]
            }
           ]
        },
        content: [
          {
            table:{
              widths: [ 16, 65, 65, "*", 38,40],
              headerRows: 1,
              keepWithHeaderRows: 1,
              dontBreakRows: true,
              body:[
                [
                  {text:'No',style:['no'],fillColor: thBgWeb,color:thColor,border:thBoder},
                  {text:'ジャンル',style:['tdGen'],fillColor: thBgWeb,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'出版社',style:['tdGen'],fillColor: thBgWeb,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'雑誌名（50音順）',style:['tdGen'],fillColor: thBgWeb,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'発行間隔',style:['tdGen','center'],fillColor: thBgWeb,color:thColor,borderColor:thBg,border:thBoder},
                  {text:'最新号閲覧\n※',style:['tdGen','center'],fillColor: thBgWeb,color:thColor,borderColor:thBg,border:thBoder}
                ],
                ...renderDataWeb,
              ]
            }
          },
          {
            text:'最新号の閲覧状況は雑誌の発売日変更や出版社都合により、リストと異なる場合がございます。',
            alignment:'center',
            fontSize:9,
            margin:[0,8,0,0],
            color:thBg
          }
        ],
          defaultStyle: {
          font: 'NotoSansJP'
        }
      }

      //全タイトル1ページ
     const docAllQuick = {
        pageSize: 'A4',
        pageMargins: [ 8,46,8,14 ],
        styles: {
          center:{
            alignment: 'center'
          },
          fnt6:{
            fontSize:6
          },
          genreName:{
            fontSize:8,
            bold: true,
            color:'#ffffff'
          },
          genreCount:{
            fontSize:8,
            color:'#ffffff'
          },
          toc:{
            fontSize:8,
            color:'#ffffff',
            alignment: 'right'
          },
          ttl:{
            fontSize:8,
            lineHeight: 1.25,
            margin: [7, 2, 2, 8],
          }
        },
        header: function() {
          return [
            {
              margin: [8, 8, 8, 0],
              columns: [
              {
                  image:'data:image/png;base64,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',
                  width:120
                },
                {text:'配信タイトル'+data.length+'誌',fontSize:12,margin:[10,0]},
                {text:settingDate+"現在",fontSize:7,margin:[0,5],alignment: 'right'}
              ],
            },
          ]
        },
        footer: function(currentPage, pageCount) {
           return [
            {
              columns:[
                {
                  text:currentPage.toString() + ' / ' + pageCount,
                  fontSize:7,
                  alignment: 'center'
                },
              ]
            }
           ]
        },
        content: [
          ...renderDataQuick

        ],
          defaultStyle: {
          font: 'NotoSansJP'
        }
      }
      //csv変換
      function generateCSV(orderData, csv) {
        orderData.forEach((item ,idx) => {
          //最新号閲覧
          let vpIDText;
          switch (item.vpID) {
            case '10':
              vpIDText = "◎";
              break;
            case '20':
              vpIDText = "○";
              break;
            case '30':
              vpIDText = "×";
              break;
            default:
              vpIDText = "";
          }
          //次号予定
          let distributionStartsText;
          if(item.distributionStarts.length){
            distributionStartsText = item.distributionStarts[0];
          }else{
            distributionStartsText = "";
          }

          const row=[
            `"${idx + 1}"`,//no
            `"${item.new}"`,//新規
            `"${item.genreName}"`,//ジャンル名
            `"${item.publisher}"`,//出版者
            `"${item.title}"`,//雑誌名
            `"${item.streamed}"`,//サイクル
            `"${vpIDText}"`,//最新号閲覧
            `"${item.viewStart}"`,//閲覧開始日（雑誌発売日より起算して）
            `"${item.deliveryRange}"`,//配信期間
            `"${item.deliveryScore}"`,//配信点数
            `"${item.browsePossible}"`, // 閲覧可能（筆頭）
            `"${distributionStartsText}"`//次号予定
        ];
        csv.push(row.join(','));
        });
      }

      //csv
      const csvTitleSort = [
        '"No","新規","ジャンル","出版社名","雑誌名","発行間隔","最新号閲覧","閲覧開始日（雑誌発売日より起算して）","配信期間","配信点数","閲覧可能（筆頭）","次号予定"'
      ];
      const csvGenreSort = [
        '"No","新規","ジャンル","出版社名","雑誌名","発行間隔","最新号閲覧","閲覧開始日（雑誌発売日より起算して）","配信期間","配信点数","閲覧可能（筆頭）","次号予定"'
      ];

      //ジャンル順
      const genreSortData=_.orderBy(orderData, 'genreID', 'asc');

      generateCSV(orderData, csvTitleSort);
      generateCSV(genreSortData, csvGenreSort);

      // CSVデータを生成する
      //const csvContentTitle = csvTitleSort.join('\n');// BOM無し
      //const csvContentGenre = csvGenreSort.join('\n');// BOM無し
      const csvContentTitle = '\ufeff' + csvTitleSort.join('\n'); // BOM付き
      const csvContentGenre = '\ufeff' + csvGenreSort.join('\n'); // BOM付き

      // CSVデータをBlobオブジェクトに変換する
      const blobTitle = new Blob([csvContentTitle], { type: 'text/csv;charset=utf-8' });
      const blobGenre = new Blob([csvContentGenre], { type: 'text/csv;charset=utf-8' });

      // ダウンロード用のリンクを作成
      const linkTitle = document.createElement('a');
      const linkGenre = document.createElement('a');
      linkTitle.setAttribute('href', URL.createObjectURL(blobTitle));
      linkGenre.setAttribute('href', URL.createObjectURL(blobGenre));
      linkTitle.setAttribute('download', 'titlesort'+fileName+'.csv');
      linkGenre.setAttribute('download', 'genresort'+fileName+'.csv');
      document.body.appendChild(linkTitle);
      document.body.appendChild(linkGenre);

      //download
      if(type=='lib'){
        pdfMake.createPdf(docDefLib).download('kanri'+fileName+'.pdf');
      }
      if(type=='web'){
        pdfMake.createPdf(docDefWeb).download('web'+fileName+'.pdf');
      }
      if(type=='all'){
        pdfMake.createPdf(docAllQuick).download('dl_magazine'+fileName+'.pdf');
      }
      if(type=='csv'){
        linkTitle.click();
        linkGenre.click();
      }
    }
  }
}
</script>
